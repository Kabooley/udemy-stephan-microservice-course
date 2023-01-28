# Note: Seciton3: Running services with Docker

## 参考

書籍：

『Docker/Kubernetes実践コンテナ開発入門』が詳しい。

講義の内容を完全にカバーしている。

Docs:

https://kubernetes.io/docs/concepts/overview/

https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/

## Kubernetsのマニフェスト

https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/#required-fields

必須フィールド：

```bash
# apiVersion: どのKubernetes APIバージョンを使ってオブジェクトを生成するのか指定する
apiVersion: apps/v1
# kind: どんなオブジェクトを作るのか指定する
kind: Deployment
# metadata: オブジェクトを一意に識別するためのnameまたはUIDまたはnamespaceを含めた情報
metadata:
  name: nginx-deployment
# spec: オブジェクトにどんな状態を望むのか定義する
# ネストさせて詳しい内容を定義する
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 2 # tells deployment to run 2 pods matching the template
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80
```

> 正しい`spec`の定義はkubernetesオブジェクトによって異なる。

## deployの問題

現在のアプリケーションの構造をできるだけ変更せずにオンラインで公開するにはどうすればいいか

Azure? AWS? GCP?などのような仮想マシンをレンタルするのがいっぱんてき。

今、commentsサーバに負荷がかかったとする。

そんなとき負荷を減らすためにどうすればいいのか？

それはcommentsサーバを増やすことである。

問題は単純にコピーしたサーバは別々のポート番号を割り当てられることである。

現状アプリケーションはすべてのサーバはポート番号を知っていることを前提に構築されているので、

これだとうまくいかない

つまり実際に稼働しているサーバとコードを結びつけなくてはならない。

これらの問題をDockerとKubernatesで解決していく。

#### why docker?

Dockerコンテナと実行中のプログラムの各インスタンスとの間に1対1のペアリングを設けることができる。

Dockerはどのように問題を解決するのか?

- 実行中のアプリケーションの実行環境が要求される
- 実行中のアプリケーションが要求する正確な実行方法が要求される

Dockerは両方の問題を解決する。

Dockerはすべてをラッピングして同じ環境、同じ起動方法でアプリケーションを実行できる。

#### Why kubernates?

> まず、Kubernetes とは何ですか?
> Kubernetes は、さまざまなコンテナーをまとめて実行するためのツールです。
> Kubernetes を利用するときは、いくつかの構成ファイルを提供します。
> これらの構成ファイルは、アプリケーションで実行するさまざまなコンテナーについて Kubernetes に伝えます。
> 次に、Kubernetes は、プログラムを実行するこれらのコンテナーを作成し、これらすべての異なるコンテナー間の通信または基本的にネットワーク リクエストも処理します。
> したがって、**Kubernetes は、いくつかの異なるプログラムを実行し、それらのプログラム間の通信を非常に簡単かつ単純にするためのツールであると想像できます。**
> もちろん、これを口頭で定義したり、口頭で、口頭で説明したりするだけでは、あまり役に立ちません。
> それでは、図を見て、Kubernetes とは何かをよりよく理解しましょう。
> Kubernetes では、クラスターと呼ばれるものを作成します。
> クラスターは、さまざまな仮想マシンのセットです。
> ここに表示されているように、仮想マシンを 1 つだけ持つことができます。
> または、数百または数千の仮想マシンを持つこともできます。
> ノードと呼ばれるこれらのさまざまな仮想マシンはすべて、マスターと呼ばれるものによって管理されます。
> マスターは本質的に、クラスター内のすべて、実行中のすべての異なるプログラム、これらの仮想マシンのすべての異なる側面、およびその他多くのものを管理するプログラムです。
> いくつかのプログラムを実行するように Kubernetes に指示します。
> これを行うと、プログラムが取得され、これらのノードの 1 つによって実行されるように多かれ少なかれランダムに割り当てられます。
> 繰り返しますが、ノードは実際には単なる仮想マシンです。

クラスタ：Kubernetesの様々なリソースを管理する集合体である。クラスタはNode, MasterNodeを抱える。

Node: Kubernetesクラスタの管理下に登録されているDocker(コンテナ)ホストのこと。

Pod: コンテナ集合体の単位で、コンテナを実行する方法を定義する。



#### Docker Recapping

--> `basic-of-docker.md`へ。

## postサービスのDocker化

post/Dockerfile

```Dockerfile
FROM node:alpine

WORKDIR /app

COPY package.json

RUN npm install

COPY ./ ./

CMD ["npm", "start"]
```

`COPY ./ ./`するときにnode_modules/を含めたくない。

なので`.dockerignore`を用いる。

```dockerignore
node_moodules
```


#### Review some basic commands

コマンドの復讐

```bash
# カレントディレクトリのDockerfileをもとにどっかーイメージを生成し、タグ付けしている
$ docker build -t stephangrinder/posts .
# ドッカーイメージをコンテナに展開して実行する
$ docker run <image-id or image tag>
# ドッカーイメージをコンテナに展開してデフォルトコマンドを上書きする
$ docker run -it <image-id or image tag> <cmd>
# cmdを指定の実行中コンテナ内部で実行させる
$ docker exec -it <container-id> <cmd>
# そのコンテナ内のプライマリプロセスが出力したログを表示してくれる
$ docker logs <container-id>
```

#### Dockering other services

`./blog/posts/`に作ったDockerfileと.dockerignoreをすべてのサービスルートディレクトリ貼り付ける。

#### Installing Kubernetes

Kubernetesは異なるコンテナをまとめて実行するためのツールである。

TODO: それを行う前にwslのスナップショットをとっておこう。

```powershell
PS C:\Users\user1> cd wsl_snapshot
# wslじょうのディストリビューションを確認して
PS C:\Users\user1> wsl -l -v
# ディストリビューションを指定する。
# Ubuntu-20.04かも
PS C:\Users\user1>  wsl --export Ubuntu wsl_snapshot_after_installed_docker
```
参考

https://qiita.com/PoodleMaster/items/b54db3608c4d343d27c4

minikube installation

https://minikube.sigs.k8s.io/docs/start/

https://qiita.com/XPT60/items/ef9fbe82127b5b559b44

https://kubernetes.io/ja/docs/tasks/tools/install-kubectl/

講義では`MicroK8`を使うなとのこと。

手順まとめ：

```bash
# Ubuntu-2004 on WSL2 へ kubectl, Minikubeのインストール
# 
# 参考
# https://kubernetes.io/ja/docs/tasks/tools/install-kubectl/
$ cd ~
$ curl -LO "https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl"
# パーミッション
$ chmod +x ./kubectl
$ sudo mv ./kubectl /usr/local/bin/kubectl
# 確認
$ kubectl version --client
# 設定の検証
$ kubectl cluster-info
# The connection to the server <server-name:port> was refused - did you specify the right host or port?

# minikubeが必要であるということらしい
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
$ curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 73.1M  100 73.1M    0     0  3978k      0  0:00:18  0:00:18 --:--:-- 5356k
$ sudo install minikube-linux-amd64 /usr/local/bin/minikube
$ minikube start
😄  minikube v1.28.0 on Ubuntu 20.04
✨  Automatically selected the docker driver. Other choices: ssh, none

🧯  The requested memory allocation of 2200MiB does not leave room for system overhead (total system  memory: 2990MiB). You may face stability issues.
💡  Suggestion: Start minikube with less memory allocated: 'minikube start --memory=2200mb'

📌  Using Docker driver with root privileges
👍  Starting control plane node minikube in cluster minikube
🚜  Pulling base image ...
💾  Downloading Kubernetes v1.25.3 preload ...
    > preloaded-images-k8s-v18-v1...:  385.44 MiB / 385.44 MiB  100.00% 2.03 Mi
    > gcr.io/k8s-minikube/kicbase:  386.27 MiB / 386.27 MiB  100.00% 1.88 MiB p
    > gcr.io/k8s-minikube/kicbase:  0 B [_______________________] ?% ? p/s 2m2s
🔥  Creating docker container (CPUs=2, Memory=2200MB) ...
🐳  Preparing Kubernetes v1.25.3 on Docker 20.10.20 ...
    ▪ Generating certificates and keys ...
    ▪ Booting up control plane ...
    ▪ Configuring RBAC rules ...
🔎  Verifying Kubernetes components...
    ▪ Using image gcr.io/k8s-minikube/storage-provisioner:v5
🌟  Enabled addons: default-storageclass, storage-provisioner
🏄  Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
$ 
```

ひとまずインストールはできたみたい。

#### Kubernetes tour

Dockerに、`./blog/posts/`をフィードしてpostsのDockerイメージが生成された。

これでposts/のコンテナをいくらでも複製できるようになった。

これからこれらコンテナを管理するKubernetesが扱うところの、クラスターについて。

- **Kubernetes Cluster**: Nodeのコレクションであり、それらの管理マスターである。

- **Node**: コンテナを実行するVM。要はコンテナを実行する器。

- **Pod**: 1つ以上のコンテナを実行できる、Node上に存在する概念

- **Deployment**: Podsを監視する。Podsを実行させたり再起動させたりする。

- **Service**: 実行中のコンテナにアクセスするための覚えやすい URL を提供します

## Notes on Config files

設定ファイルについての注意点。

「オブジェクト」：KUbernetesで作成するデプロイメント、ポッド、サービスなどを総称してオブジェクトと呼ぶ。

Kubernetes Config files:

- Kubernetesへ、生成したい様々なデプロイメント、ポッド、サービスについて伝えるファイル。

- YAMLで書く。

- 常時プロジェクトのソースコードのある場所へ保存しておくこと。

- 設定ファイル抜きにオブジェクトを生成することなかれ。設定ファイルは、クラスタが何を実行しているかの正確な定義を提供するモノである。


公式でも設定ファイル抜きでオブジェクトを作るチュートリアルなどあるが、必ず設定ファイルは生成せよとのこと。


#### Creating Pod

```bash
$ cd posts/
# 
$ docker build -t stephansgrinder/posts:0.0.1 .

$ mkdir infra/
$ mkdir infra/k8s
$ touch infra/k8s posts.yml
```

```yaml
apiVersion: v1
kind: Pod
metadata: 
    name: posts
spec:
    containers:
        - name: posts
          image: stephangrinder/posts:0.0.1
```

設定ファイルからオブジェクト（pod)を生成する

```bash
$ cd ../infra/k8s
$ kubectl apply -f posts.yaml
pod/posts created
$
```
```bash
# クラスタの中のpodsの一覧を表示する
$ kubectl get pods
```

#### Understand a Pod spec

https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/

#### Common kubectl commands

Dockerコマンドはあまり使わなくなって、Kubectlのコマンドを代わりに使うようになってくる

```bash
# クラスタのpod一覧を表示する
$ kubectl get pods
# 実行中のpod内で与えられたcmdを実行させる
$ kubectl exec -it [pod-name] [cmd]
# 指定のpodのログを出力する
$ kubectl logs [pod-name]
# 指定のpodを削除する
$ kubectl delete pod [pod-name]
# 設定を反映させる
$ kubectl apply -f [config file name]
# 実行中のpodの何らかの情報を出力する
$ kubectl describe pod [pod-name]
```
#### エイリアスで時間の節約

要は指定のコマンドの短縮形を登録してコマンド入力の煩わしさを緩和しようという話

## デプロイメント

#### デプロイメントの導入

通常podは直接作成するのではなくて、代わりにデプロイメントと呼ばれるものを作成する。

もっというと、ReplicaSetというクラスタのリソースがpodsを管理し、

DeploymentがReplicaSetを管理するのである。

こんな感じ？

`Deployment --> create --> ReplicaSet --> create --> [pod1, pod2, pod3,...]`

たとえば、

podの一つがクラッシュしたときに、

podを管理するReplicaSetまたはDeploymentがそのpodを削除して改めて復元する...

みたいなことができる。

講義ではこの時はReplicaSetは作っていない。

Deploymentのconfig

```yaml
# スペースとタブなどホワイトスペース厳密にしないとよみとられないめんどい
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
                image: stephangrinder/posts:0.0.1
```

#### デプロイメントのコマンド意味

```bash
# Deploymentの一覧を表示する。docker psと同じ。
$ kubectl get deployments
# まぁあとあpodの時と同じかと
$ kubectl describe deployment [depl-name] 
$ kubectl apply -f [config file name]
$ kubectl delete deployment [depl-name]
```

```bash
# Deploymentの生成
$ kubectl apply -f blog/posts/infra/k8s/posts-depl.yaml
deployment.apps/posts-depl created
# Deploymentの一覧の表示
# 
# READYは、稼働中のポッドの数/使用可能な準備万端なポッドの数
# AVAILABLEは、
$ kubectl get deployments
NAME         READY   UP-TO-DATE   AVAILABLE   AGE
posts-depl   0/1     1            0           14m

# Deploymentが管理しているpodが削除されても、
# Deploymentが自動的に新しいpodを作成する
$ kubectl get pods
NAME                          READY   STATUS             RESTARTS   AGE
posts                         0/1     ImagePullBackOff   0          102m
posts-depl-847877c748-ckdrd   0/1     ImagePullBackOff   0          34m
$ kubectl delete pod posts-depl-847877c748-ckdrd
pod "posts-depl-847877c748-ckdrd" deleted
# posts-depl-~が再度作成されているのがわかる。
# ただし、末尾の半角英筋が異なる
$ kubectl get pods
NAME                          READY   STATUS              RESTARTS   AGE
posts                         0/1     ImagePullBackOff    0          103m
posts-depl-847877c748-4snn8   0/1     ContainerCreating   0          5s

# Deploymentの詳細を出力する
$ kubectl describe deployment posts-depl
Name:                   posts-depl
Namespace:              default
CreationTimestamp:      Wed, 18 Jan 2023 20:46:47 +0900
Labels:                 <none>
Annotations:            deployment.kubernetes.io/revision: 1
Selector:               app=posts
Replicas:               1 desired | 1 updated | 1 total | 0 available | 1 unavailable
StrategyType:           RollingUpdate
MinReadySeconds:        0
RollingUpdateStrategy:  25% max unavailable, 25% max surge
Pod Template:
  Labels:  app=posts
  Containers:
   posts:
    Image:        stephangrinder/posts:0.0.1
    Port:         <none>
    Host Port:    <none>
    Environment:  <none>
    Mounts:       <none>
  Volumes:        <none>
Conditions:
  Type           Status  Reason
  ----           ------  ------
  Available      False   MinimumReplicasUnavailable
  Progressing    True    ReplicaSetUpdated
OldReplicaSets:  <none>
NewReplicaSet:   posts-depl-847877c748 (1/1 replicas created)
Events:
  Type    Reason             Age   From                   Message
  ----    ------             ----  ----                   -------
  Normal  ScalingReplicaSet  41m   deployment-controller  Scaled up replica set posts-depl-847877c748 to 1


# delete deploymentでデプロイメントとそのデプロイメントが管理するpod等も削除される
$ kubectl delete deployment deployment.apps/posts-depl
error: there is no need to specify a resource type as a separate argument when passing arguments in resource/name form (e.g. 'kubectl get resource/<resource_name>' instead of 'kubectl get resource resource/<resource_name>'
$ kubectl delete deployment.apps/posts-depl
deployment.apps "posts-depl" deleted
$ kubectl get deployment
No resources found in default namespace.
$ kubectl get pods
NAME    READY   STATUS             RESTARTS   AGE
posts   0/1     ImagePullBackOff   0          116m
$
```

#### 非推奨：Deploymentを更新する方法

NOTE: 以下の方法は頻繁に使われる手法ではない。

理由は変更を加えるたびにyamlのバージョンの値を更新しなくてはならない。

これはエラーの引き金になりやすいらしい。

タイプミスとか、バージョン番号間違えたりとか。

よりよい方法は次のレクチャーで。

steps:

- ローカルでファイルの変更を行う
- イメージを指定してリビルド
- Deploymentのコンフィグファイルではバージョンだけ更新する
- 実行：`kubectl apply -f [depl file name]`

NOTE: kubenetesにはyamlの変更のたびに変更を適用させないと認識してくれないよ

kubernetesはconfigファイルのapplyを実行されるたびに、

構成ファイルが既存のものか新規化を認識して

オブジェクトを更新するだけか新しく作るのかを決定する。

```bash
# posts/index.jsを変更した
$ cd blog/posts
$ docker build -t stephangrinder/posts:0.0.5 .
Sending build context to Docker daemon  109.6kB
Step 1/6 : FROM node:alpine
 ---> 17299c0421ee
Step 2/6 : WORKDIR /app
 ---> Using cache
 ---> 04e3e8692010
Step 3/6 : COPY package.json ./
 ---> Using cache
 ---> 6941117486f6
Step 4/6 : RUN npm install
 ---> Using cache
 ---> daf48a995513
Step 5/6 : COPY ./ ./
 ---> 0d2484197713
Step 6/6 : CMD ["npm", "start"]
 ---> Running in 40e8650caa43
Removing intermediate container 40e8650caa43
 ---> f5a52042225f
Successfully built f5a52042225f
Successfully tagged stephangrinder/posts:0.0.5
# posts-depl.yamlのバージョン情報を更新した
# この変更を適用させる
$ cd infra/k8s
$ ls
posts-del.yaml
# 構成ファイルの変更の適用
# `created`なら新規にオブジェクトを生成した
# `configured`なら既存のオブジェクトを更新した
# 今回は新規である
$ kubectl apply -f posts-depl.yaml
deployment.apps/posts-depl created
```

変更内容

```yaml
# 前略...
# posts:0.0.5
        spec: 
            containers: 
              - name: posts
                image: stephangrinder/posts:0.0.5
```

#### 推奨：Deploymentの更新する方法

NOTE: dockerイメージのタグ付けについて[docker-pushの注意](#docker-pushの注意)

STEPS:

- deployment(yaml)は必ず`pod spec`に`latest`を適用させなくてはならないようにする
- 既存ファイルを変更する
- Dockerイメージをビルドする
- イメージをDockerhubへpushする
- 次のコマンドを実行する：`kubectl rollout restart deployment [depl-name]`


```yaml
# 前略...
# posts:latest
        spec: 
            containers: 
              - name: posts
                # image: stephangrinder/posts:latest
                # もしくは、バージョンを省略する
                image: stephangrinder/posts
```
```bash
$ pwd 
posts/
# posts-depl.yamlに上記の変更を程したのち...
$ kubectl apply -f infra/k8s/posts-depl.yaml
deployment.apps/posts-depl configured
# posts/index.jsに変更を施したのち...
$ docker build -t $username/posts .
...
Successfully built 3d515f32674b
Successfully tagged $username/posts:latest
# それをDockerhubへプッシュする
$ docker push $username/posts
# タグ付けで`latest`が付与される
Using default tag: latest
The push refers to repository [docker.io/$username/posts]
165089ca7613: Pushed 
59c0dc796a42: Pushed 
d8508afcc3f2: Pushed 
65ab454ea515: Pushed 
6d0edcc4175b: Pushed 
887a67b27874: Pushed 
a49d675cd49c: Pushed 
8e012198eea1: Pushed 
latest: digest: sha256:c3beb5d0fb8892f485e1b26d1165d60de20f56c3089ff693619fe3f6ad4c9589 size: 1992



$ kubectl get deployments
NAME         READY   UP-TO-DATE   AVAILABLE   AGE
posts-depl   1/1     1            1           58m
$ kubectl rollout restart deployment posts-depl
deployment.apps/posts-depl restarted
$ kubectl get deployments
NAME         READY   UP-TO-DATE   AVAILABLE   AGE
posts-depl   1/1     1            1           58m
$ kubectl get pods
NAME                         READY   STATUS    RESTARTS   AGE
posts-depl-84c5c5bdb-tsm4m   1/1     Running   0          29s
$ kubectl logs posts-depl-84c5c5bdb-tsm4m

> posts@1.0.0 start
> nodemon index.js

[nodemon] 2.0.20
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node index.js`
# 変更内容が適用されている！
v55
Listening on 4000
```

## サービス

Kubernetesのクラスターの「サービス」オブジェクトについて。

> Podの集合にアクセスするための経路を定義する。

#### サービスによるネットワーキング

サービスの役割。
クラスターの外との通信の為にサービスが活躍する。
特定のpodへのアクセス制御など。

Serviceのタイプ：

- Cluster IP: podへアクセスするための覚えやすいURLを用意する。Cluster内部にのみ公開される。
- Node Port: Clusterの外部からPodへアクセスできるようにするためのポート番号。通常開発にのみ利用される。
- Load Balancer: Clusterの外部からPodへアクセスできるようにするためのもの。これはpodを外部へ公開するための正しい方法である。
- External Name: 省略


同一クラスター内のPod間で通信するために必要なサービスは？

Clust IPを使う。理由はクラスター内部にのみ公開されるアクセス方法だから。

ローカルブラウザからクラスタ内部へアクセスるための手段を提供できるサービスは？

ロードバランサー。

#### Node Port Serviceの作成

ロードバランサーは追加構成要素をたくさん用意しなくてはならず大変なので

Nodeportを用いる。

もちろん開発の為だけであるので、アプリケーションを公開したらNodePortは使わない。

Serviceのconfigファイル：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: posts-srv
spec:
  # NodePortをここで指定する
  type: NodePort
  selector:
    app: posts
  ports:
    - name: posts
      protocol: TCP
      # NodePortへのポート番号
      port: 4000
      # Podへのポート番号
      targetPort: 4000
```

ポート番号の決まり方：

```
クラスター外部
||
\/
NodePort `Port 3xxxx`
||
\/
----------------------------------
| Cluster                         |
|                                 |
|   Port 4000 --> NodePortService |
|                                 |
|   --> TargetPort 4000 --> Pod   |
----------------------------------
```

#### Node Portサービスへのアクセス

```bash
$ kubectl apply -f infra/k8s/posts-srv.yaml
service/posts-srv created
$ kubectl get services
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP          46h
posts-srv    NodePort    10.110.111.51   <none>        4000:30183/TCP   11s
$ kubectl describe service posts-srv
Name:                     posts-srv
Namespace:                default
Labels:                   <none>
Annotations:              <none>
Selector:                 app=posts
Type:                     NodePort
IP Family Policy:         SingleStack
IP Families:              IPv4
IP:                       10.110.111.51
IPs:                      10.110.111.51
Port:                     posts  4000/TCP
TargetPort:               4000/TCP
# ここがNodePrtのポート番号
NodePort:                 posts  30183/TCP
Endpoints:                172.17.0.3:4000
Session Affinity:         None
External Traffic Policy:  Cluster
Events:                   <none>
```

つまり30183

30183 --> 4000 --> 4000と解決されていく。

ローカルマシンから：`localhost:30183/posts`

Minikube: (マシンや割り当てに依て異なるアクセスIPアドレス):30183/posts

#### Clust IP Serviceの設定

ClusterIPの役割はpodをクラスター内の他のpodへ公開することである。

今、一つのNodeにpodが2つあるとする。

postとevent-busである。

pod同士は直接やり取りすることはできない。

podに割り当てられるipアドレスを事前に知ることができないからである。

この互いのIPアドレスがなんであるのかをClustIPServiceが管理する。

前のセクションで作っていたアプリケーションでは

各サービスがevent-busへ通信を、またはその逆を行っていたが

今後は具体的にどのURLでアクセスすればいいのか事前に知るすべがなくなるので

各サービスへアクセスする代わりに、ClustIpサービスへあくせすするようにする。

posts --> event-busが

posts --> event-busのClustIpService --> event-bus

もしくは

event-bus --> postsが,

event-bus --> postsのClustIpService --> posts

という具合に通信の間に立ってもらうようになる。

#### event-busのdeploymentの構築

event-busのイメージを構築する

そのイメージをDockerhubへpushする

event-busのdeploymentを作成する

postsとevent-busのClusterIPサービスを構築する

```bash
# event-busのイメージの生成
$ docker build -t $username/event-bus .
...
Successfully built 83c698f1eb68
Successfully tagged kabooley/event-bus:latest
$ docker login -u kabooley
Password: 

...
Login Succeeded
# イメージのpush
$ docker push kabooley/event-bus 
Using default tag: latest
The push refers to repository [docker.io/kabooley/event-bus]
726cdbd61825: Pushed 
f0b59e71cf8e: Pushed 
4a936045809d: Pushed 
7ffc5b42c0e0: Pushed 
6d0edcc4175b: Mounted from library/node 
887a67b27874: Mounted from library/node 
a49d675cd49c: Mounted from library/node 
8e012198eea1: Mounted from library/node 
...
$ cd ../infra/k8s
# deploymentの作成
# 内容はposts-depl.yamlと同じ
$ kubectl apply -f event-bus-depl.yaml
deployment.apps/event-bus-depl created
```
#### ClusterIPServiceの定義

deploymentファイルにClustIPServiceの内容を追記する。

一つのconfigファイルに複数のオブジェクトを定義してもいいらしい。

`---`で区切る。

```yaml
# event-bus-depl.yaml
---
apiVersion: v1
kind: Service
metadata:
    name: event-bus-srv
spec:
    selector:
        app: event-bus
    # type: ClusterIP # 省略可能とのこと
    ports: 
        - name: event-bus
          protocol: TCP
          port: 4005
          targetPort: 4005
```

```bash

$ kubectl apply -f event-bus-depl.yaml
deployment.apps/event-bus-depl unchanged
service/event-bus-srv created
$ kubectl get services
NAME            TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
event-bus-srv   ClusterIP   10.100.192.116   <none>        4005/TCP         2m16s
kubernetes      ClusterIP   10.96.0.1        <none>        443/TCP          24h
posts-srv       NodePort    10.96.85.190     <none>        4000:31660/TCP   18s
```

```yaml
# posts-depl.yaml
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
$ kubectl apply -f posts-depl.yaml
deployment.apps/posts-depl unchanged
service/posts-clusterip-srv created
$ kubectl get services
NAME                  TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
event-bus-srv         ClusterIP   10.100.192.116   <none>        4005/TCP         11m
kubernetes            ClusterIP   10.96.0.1        <none>        443/TCP          25h
posts-clusterip-srv   ClusterIP   10.105.72.116    <none>        4000/TCP         5s
posts-srv             NodePort    10.96.85.190     <none>        4000:31660/TCP   9m33s
```

#### How to communicate between Services

posts/index.jsではevent-busと通信するときのURLが基地である全逓のコードになっている。

(他のサービスもすべてそうなのだけども)

今、クラスター内部でClusterIPサービスに代わりに通信してもらう都合上、

URLは既知でない。

どうすればいいか？

```JavaScript
// posts/index.js
app.post('/posts', async (req, res) => {
    const id = randomBytes(4).toString('hex');
    const { title } = req.body;
    
    posts[id] = {
        id, title
    };

    await axios.post('http://localhost:4005/events', {
        type: 'PostCreated',
        data: {
            id, title
        }
    });

    res.status(201).send(posts[id]);
});
```

次のようにすればよい。

```
posts --> event-busのClustIpService --> event-bus
posts --> HTTPRequest`http://event-bus-srv --> `event-busのClustIpService --> event-bus
```

つまり、

localhost:portnumber から アクセスしたいサービス（アプリケーションのマイクロサービスという意味のサービス）のサービス（Kubernetesの言うところのサービス）へ置き換えればいいだけ。

```JavaScript
// posts/index.js
app.post('/posts', async (req, res) => {


  // localhost --> event-bus-srv
    await axios.post('http://event-bus-srv:4005/events', {
        type: 'PostCreated',
        data: {
            id, title
        }
    });

    res.status(201).send(posts[id]);
});

```
```JavaScript
// event-bus/index.js
app.post('/events', (req, res) => {
    const event = req.body;

    // NOTE: イベントを保存する
    event.pus(event);

    axios.post("http://posts-clusterip-srv:4000/events", event).catch((err) => {
        console.log(err.message);
    });
    // axios.post("http://localhost:4001/events", event).catch((err) => {
    //     console.log(err.message);
    // });
    // axios.post("http://localhost:4002/events", event).catch((err) => {
    //     console.log(err.message);
    // });
    // axios.post("http://localhost:4003/events", event).catch((err) => {
    //     console.log(err.message);
    // });
    res.send({status: 'OK'});
});
```
ローカルファイルを更新したので改めてdockerイメージを生成する

```bash
$ docker build -t $username/posts .
$ docker build -t $username/event-bus .
# 両方docker pushして...
$ dcoker rollout restart deployment posts-depl
$ dcoker rollout restart deployment event-bus-depl
# deploymentを再起動した

```

#### postsmanでHTTP通信

どんなURLならCluster内部にアクセスできるんだい？

```bash
$ kubectl get services
NAME                  TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
event-bus-srv         ClusterIP   10.101.89.14    <none>        4005/TCP         12m
kubernetes            ClusterIP   10.96.0.1       <none>        443/TCP          2d23h
posts-clusterip-srv   ClusterIP   10.96.246.193   <none>        4000/TCP         12m
posts-srv             NodePort    10.110.111.51   <none>        4000:30183/TCP   25h

```

アクセスできない！

下記の通りに解決した。

#### minikube issue: NodePort サービスへのホスト側からのアクセス手段

参考：

https://minikube.sigs.k8s.io/docs/handbook/accessing/

> The network is limited if using the Docker driver on Darwin, Windows, or WSL, and the Node IP is not reachable directly.

> Running minikube on Linux with the Docker driver will result in no tunnel being created.

> Services of type NodePort can be exposed via the minikube service <service-name> --url command. It must be run in a separate terminal window to keep the tunnel open. Ctrl-C in the terminal can be used to terminate the process at which time the network routes will be cleaned up.

> Darwin、Windows、WSLでDockerドライバを使用した場合、ネットワークが制限され、Node IPに直接到達することができません。

> Linux上でDockerドライバを使用してminikubeを実行すると、トンネルは作成されません。

> NodePortタイプのサービスは、minikube service <service-name>--urlコマンドで公開することができます。トンネルを開いたままにするには、別のターミナルウィンドウで実行する必要があります。ターミナルのCtrl-Cで処理を終了させると、ネットワーク経路がクリーンアップされます。

ということで、

`minikube start`したターミナルとは別のターミナルを開く。

その別ターミナルで`minikube service <service-name> --url`を実行する。

そのターミナルが開かれている限り、トンネルが維持される。

出力されたIPアドレスならホストがわからアクセスできる...という話。

でその出力されたIPアドレスを使ってにアクセスしてみたところ、

エラーになる。

エラーはアプリケーションのなかでどうなっているか見てみたところ...


```bash
$ kubectl logs posts-xxxxxx

> posts@1.0.0 start
> nodemon index.js

[nodemon] 2.0.20
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node index.js`
v55
Listening on 4000
/app/node_modules/axios/lib/core/createError.js:16
  var error = new Error(message);
              ^

Error: Request failed with status code 500
    at createError (/app/node_modules/axios/lib/core/createError.js:16:15)
    at settle (/app/node_modules/axios/lib/core/settle.js:17:12)
    at IncomingMessage.handleStreamEnd (/app/node_modules/axios/lib/adapters/http.js:269:11)
    at IncomingMessage.emit (node:events:525:35)
    at endReadableNT (node:internal/streams/readable:1359:12)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21) {
  config: {
    url: 'http://event-bus-srv:4005/events',
    method: 'post',
    data: '{"type":"PostCreated","data":{"id":"8d5ae5e0","title":"title: Hard to access NodePort"}}',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'User-Agent': 'axios/0.21.4',
      'Content-Length': 88
    },
    transformRequest: [ [Function: transformRequest] ],
    transformResponse: [ [Function: transformRespons
# ...

Node.js v19.4.0
[nodemon] app crashed - waiting for file changes before starting...
```

とクラッシュしてそのままになっている模様。

だからpostmanにはエラーが出力されているわけだ。

みたところ、postmanからのbodyは、posts-srvには届いちゃいるみたい。

`"title":"title: Hard to access NodePort"`を送信したので。

ということは、postsにアクセスするところまではいけているはずなのでは？

エラーは`http://event-bus-srv:4005/events`へのpostが失敗しているので

event-busへのアクセスができていない模様。

ということで

`kubectl logs <event-bus-pod-name>`でログを確認すると

タイポを発見したのでこれを修正。

再度dockerイメージの作成、push、rolloutしてみて改めてkubectl serviceしてみる

```bash
# 本窓ターミナル
$ cd blog/event-bus
# タイポ修正
$ docker build -t $username/event-bus .
$ docker push $username/event-bus
# deploymentを再起動する
$ kubectl rollout restart deployment event-bus-depl
$ kubectl rollout restart deployment posts-depl
# 再起動によってpodが再作成されたのを確認
$ kubectl get pods
# 各podが正常に稼働しているのを確認
$ kubectl logs <pod-name>
```
```bash
# 別窓ターミナル
$ minikube service posts-srv --url
http://127.0.0.1:37255
❗  Because you are using a Docker driver on linux, the terminal needs to be open to run it.
```

表示されたURLが、ホストOS側からアクセスできるクラスターへのIPアドレスである。

これをポストマンに渡す。

`POST http://127.0.0.1:37255/posts?Content-Type=application/json`

status: 201で正常に終了した!!

長かった～

本当はVSCodeのThunderClientを使いたかったのだけど、

同じ方法ではうまくいかないので一旦保留。

#### Surface環境でなんかまた同じ問題に出くわした件

`./fix-unapplying-update-on-deployment.md`へ。

#### Add qeury, comment, moderation services

やること

- アプリケーションの各サービス間で通信するためのURLの更新
- dockerイメージの生成とdockerhubへのpush
- 各サービスごとに`<各サービス名称>-depl.yaml`とClusterIPの作成(event-bus-depl.yamlとほぼ同じ内容)
- 実行状況の確認

```bash
$ cd infra/k8s
# すべて適用するので.が早い
$ kubectl apply -f .
# podが生成されたかどうか等の確認
$ kubectl get pods
NAME                               READY   STATUS    RESTARTS      AGE
comments-depl-554fddcdf8-vcm8f     1/1     Running   0             70s
event-bus-depl-7d5f455fcf-czdxh    1/1     Running   1 (19h ago)   20h
moderation-depl-6ffdbb65d8-phg47   1/1     Running   0             68s
posts-depl-577f4d78-nk8jk          1/1     Running   0             25m
query-depl-7df9688c4d-9p272        1/1     Running   0             66s
# 何かstatusがおかしいとか詳しく稼働状況知りたいときは
$ kubectl describe pod query-depl-7df9688c4d-9p272
...
EVENTS:
----
# EVENTSの項目が一番役立つ情報載っているかも
# 全て確認して問題ないことが分かったらservicesも確認して正常稼働しているか確認する
$ kubectl get services
NAME                  TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
comments-srv          ClusterIP   10.103.141.253   <none>        4001/TCP         5m40s
event-bus-srv         ClusterIP   10.100.192.116   <none>        4005/TCP         2d22h
kubernetes            ClusterIP   10.96.0.1        <none>        443/TCP          3d23h
moderation-srv        ClusterIP   10.103.169.9     <none>        4003/TCP         5m38s
posts-clusterip-srv   ClusterIP   10.105.72.116    <none>        4000/TCP         2d21h
posts-srv             NodePort    10.96.85.190     <none>        4000:31660/TCP   2d22h
query-srv             ClusterIP   10.108.244.193   <none>        4002/TCP         5m36s
```

event-bus/index.jsのpostリスナのaxiosがコメントアウトされたままだし、

サービスごとのURLにアクセスするように更新した

再度build, push rollout restartして...

postmandの出番。

Minikube on linuxなので

```bash
# 別窓
$ minikube service posts-srv --url
```

postmandで`http://127.0.0.1:44279/posts?Content-Type=application/json`をPOSTしたら

正常に返事がきた。

各podでのアプリケーションのログを確認する。

```bash
$ kubectl logs <各podのNAME>
# 出力結果確認
```

## LoadBalancer 

あとはclientを統合するだけ。

clientはブラウザで動く部分がある。

ブラウザ（React App）とサーバ（Cluster）に分けられるはずである。

これまでの講義では、

通信が行われているのか確認するために、

postsのserviceオブジェクトをNodePortとして公開した。

NodePortは開発中に確認のために使うべきであるので、

LoadBalancerサービスを用いる。

LoadBalancerはクラスターへアクセスするための単一のエンドポイントを外部へ提供することである。

Browser --> LoadBalancer --> each pods

#### 用語：ロードバランサーとingress

`LoadBalancer`: プロバイダーに連絡してロード バランサーをプロビジョニングするように Kubernetes に指示します。単一のポッドにトラフィックを取り込みます

`Ingress`: トラフィックを他のサービスに分散するための一連のルーティング ルールを含むポッド

概念の説明：

今、クラウドサービスを提供するプロバイダ（AWSとかAzureとか）、そのクラウド内で実行されているクラスタ、プロバイダの外の世界

という3つの空間があるとする。

外部から特定のポッドへのアクセス要求 --> LoadBalancer --> Cluster --> Ingress --> 特定のpod

#### Install `Ingress Nginx`

**NOT`Nginx Ingress`**

Linux環境向け

https://kubernetes.github.io/ingress-nginx/deploy/#minikube

```bash
$ minikube start
$ minikube addons enable ingress
...
The ingress addon is enabled
# とでればOK
```

下記のingressオブジェクトの設定ファイルを適用して

```yaml
# ingress-srv.yaml

apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-srv
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  rules:
    - host: posts.com
      http:
        paths:
          - path: /posts
            pathType: Prefix
            backend:
              service:
                name: posts-clusterip-srv
                port:
                  number: 4000
```
```bash
$ kubectl apply -f ingress-srv.yaml
$ kubectl get ingress
NAME          CLASS    HOSTS       ADDRESS        PORTS   AGE
ingress-srv   <none>   posts.com   192.168.49.2   80      3h43m
```


#### Hosts File Tweak

クラスタ内部ならば、大量のインフラストラクチャをホストできる。

一つのアプリケーションをホストするだけに限定されるわけではない。

つまり、

一つのKubernetesクラスタ内に様々なドメインで様々なアプリケーションをホストできるのである。

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-srv
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  rules:
    - host: posts.com
      http:
        paths:
          - path: /posts
            pathType: Prefix
            backend:
              service:
                name: posts-clusterip-srv
                port:
                  number: 4000
```

`spec:rule:`以下の`host`は、

この構成が`posts.com`でホストされているアプリケーションに関連付けられていることを表す。

kubernetesは一つのクラスタ内部に複数のホストを抱えることができるので

この`spec:rule`ではどのホストに対して何をするのか指定する必要があるのである。

なので、`spec:rules:-host`以下は、``posts.com`に関連付けられるアプリケーションに関するルールが記述されることになる。

開発中は、実際には`posts.com`へアクセスするのではなくて自身のマシンへアクセスすることになるけれど、

あたかも`psots.com`へアクセスするようにホストマシンをだまさないといけない。


#### host側からingressへアクセス

実際にホスト側からingressへアクセスして、/postsサービスに到達できるのかテスト。

ホスト側からデフォルトのポート番号80番でingressへアクセスできるようにするために

/etc/hostsにアクセス許可をするIPアドレスとドメインを関連付ける記述をしなくてはならない。

次を記述するように、講義では指導された

```
$(minikube ip) posts.com/posts
```

NOTE: /etc/hostsはroot権限なので次の方法で編集することになる。

```bash
$ sudo vim /etc/hosts
# 最後の行に追記すること。他の記述内容を変更しないこと！
```

NOTE: 問題

- 講義の方法通りだとホスト側からingressへアクセスできない
- `minikube ip`は実際はexternal IP addressではないこと
- とはいえどんなIPアドレスを書けばいいのか手探りで探すほかないこと

podsへホスト側からアクセスするときと同様、minikube ipはexternal ipではないのでは？

https://kubernetes.io/docs/tasks/access-application-cluster/ingress-minikube/

しかし公式にはこのように書いてある

https://kubernetes.io/docs/tasks/access-application-cluster/ingress-minikube/#create-an-ingress

> Note: If you are running Minikube locally, use minikube ip to get the external IP. The IP address displayed within the ingress list will be the internal IP.

しかしstackoverflowでは

https://stackoverflow.com/a/73735009

> Append 127.0.0.1 hello-world.info to your /etc/hosts file on MacOS

なんやねん。

公式のLoadBalancerの公開方法：

https://minikube.sigs.k8s.io/docs/handbook/accessing/#loadbalancer-access

> サービスタイプ`LoadBalancer`は``minikube tunnel`コマンドで公開することができる。
> ターミナルは区別して(別窓で)Loadbalancerを実行させなくてはならない。
> Ctrl + Cでtunnelさせていたネットワークプロセスをクリーンアップすることができる。
> minikube トンネルはプロセスとして実行され、クラスターの IP アドレスをゲートウェイとして使用して、クラスターのサービス CIDR へのネットワーク ルートをホスト上に作成します。 tunnel コマンドは、外部 IP をホスト オペレーティング システムで実行されている任意のプログラムに直接公開します。

とにかく、
```bash
# /etc/hostsにホストに次を追記してから
# `EXTERNAL_IP_ADDRESS posts.com`
$ minikube tunnel
# そのあとでingressを確認すると、ADDRESSに先のアドレスが割り当てられているのが確認できる
# minikube tunnelする前は割り当てられていないから空白になっていた。
$ kubectl get ingress
NAME          CLASS    HOSTS       ADDRESS        PORTS   AGE
ingress-srv   <none>   posts.com   192.168.49.2   80      22h
```

ならばホスト側からアクセスしてみようとすると、

`posts.com/posts`
`192.168.49.2:80/posts`

どちらもアクセスできない。

まったく何も届いていないことはpodsのlogsを確認して確認済。

つまりそもそもクラスター内部にまで届いていないのでIPアドレスがおかしい。

再度、127.0.0.1にしてみる。



## DockerHubの利用

#### 基本の流れ

https://docs.docker.com/docker-hub/repos/

```bash
$ docker build -t $usename/posts .
$ docker push $username/posts
Using default tag: latest
The push refers to repository [docker.io/kabooley/posts]
165089ca7613: Pushed 
59c0dc796a42: Pushed 
d8508afcc3f2: Pushed 
65ab454ea515: Pushed 
6d0edcc4175b: Pushed 
887a67b27874: Pushed 
a49d675cd49c: Pushed 
8e012198eea1: Pushed 
latest: digest: sha256:c3beb5d0fb8892f485e1b26d1165d60de20f56c3089ff693619fe3f6ad4c9589 size: 1992
```

#### `docker push`の注意

tag名はdocker accountのusernameを必ず指定すること。

さもないとpushは拒否される。

```bash
$ docker login -u $username
password:

Login Succeeded
# 拒否される。
$ docker push stephangrinder/posts 
...
denied: requested access to the resource is denied

# $usernameに変更したので...
$ docker build -t $usename/posts .
# pushは受け入れられた!
$ docker push $username/posts
Using default tag: latest
The push refers to repository [docker.io/kabooley/posts]
165089ca7613: Pushed 
59c0dc796a42: Pushed 
d8508afcc3f2: Pushed 
65ab454ea515: Pushed 
6d0edcc4175b: Pushed 
887a67b27874: Pushed 
a49d675cd49c: Pushed 
8e012198eea1: Pushed 
latest: digest: sha256:c3beb5d0fb8892f485e1b26d1165d60de20f56c3089ff693619fe3f6ad4c9589 size: 1992
```

#### 

## Error

#### STATUS:ErrImagePull

```bash
$ docker get pods
NAME                         READY   STATUS         RESTARTS   AGE
posts-depl-6c8b45c68-vjndf   0/1     ErrImagePull   0          15s
```

みたいなとき！

#### WTF is ErrImagePull & ImagePullBackOff?

内部のkubeletと呼ばれるイメージをプルする仕事を担うプログラムが何かしらのエラーを出した状態。

- `ImagePullBackOff`: Imageをpullするときに、pathが違っていた、networkが切断されたなどのネットワークトラブルに見舞われた、kubeletが認証に失敗した

- `ErrImagePull`: Kubernetes は最初に ErrImagePull エラーをスローし、数回再試行した後、「引き戻し」、別のダウンロードの試行をスケジュールします。試行が失敗するたびに、遅延は最大 5 分まで指数関数的に増加します。

結局どうすればいいのかはまとめていない...

## Minikube basic control

https://minikube.sigs.k8s.io/docs/handbook/controls/

#### `minikube dashboard`

> Access the Kubernetes dashboard running within the minikube cluster:

ということで、

実行中のクラスタをモニタリングしてビジュアル表示してくれるコマンド。

指定のURLが出力されて、そのURLにアクセスすると今クラスターがどんな状態なのかがわかるページが表示される。


#### `minikube addons list`

|-----------------------------|----------|--------------|--------------------------------|
|         ADDON NAME          | PROFILE  |    STATUS    |           MAINTAINER           |
|-----------------------------|----------|--------------|--------------------------------|
| ambassador                  | minikube | disabled     | 3rd party (Ambassador)         |
| auto-pause                  | minikube | disabled     | Google                         |
| cloud-spanner               | minikube | disabled     | Google                         |
| csi-hostpath-driver         | minikube | disabled     | Kubernetes                     |
| dashboard                   | minikube | disabled     | Kubernetes                     |
| default-storageclass        | minikube | enabled ✅   | Kubernetes                     |
| efk                         | minikube | disabled     | 3rd party (Elastic)            |
| freshpod                    | minikube | disabled     | Google                         |
| gcp-auth                    | minikube | disabled     | Google                         |
| gvisor                      | minikube | disabled     | Google                         |
| headlamp                    | minikube | disabled     | 3rd party (kinvolk.io)         |
| helm-tiller                 | minikube | disabled     | 3rd party (Helm)               |
| inaccel                     | minikube | disabled     | 3rd party (InAccel             |
|                             |          |              | [info@inaccel.com])            |
| ingress                     | minikube | disabled     | Kubernetes                     |
| ingress-dns                 | minikube | disabled     | Google                         |
| istio                       | minikube | disabled     | 3rd party (Istio)              |
| istio-provisioner           | minikube | disabled     | 3rd party (Istio)              |
| kong                        | minikube | disabled     | 3rd party (Kong HQ)            |
| kubevirt                    | minikube | disabled     | 3rd party (KubeVirt)           |
| logviewer                   | minikube | disabled     | 3rd party (unknown)            |
| metallb                     | minikube | disabled     | 3rd party (MetalLB)            |
| metrics-server              | minikube | disabled     | Kubernetes                     |
| nvidia-driver-installer     | minikube | disabled     | Google                         |
| nvidia-gpu-device-plugin    | minikube | disabled     | 3rd party (Nvidia)             |
| olm                         | minikube | disabled     | 3rd party (Operator Framework) |
| pod-security-policy         | minikube | disabled     | 3rd party (unknown)            |
| portainer                   | minikube | disabled     | 3rd party (Portainer.io)       |
| registry                    | minikube | disabled     | Google                         |
| registry-aliases            | minikube | disabled     | 3rd party (unknown)            |
| registry-creds              | minikube | disabled     | 3rd party (UPMC Enterprises)   |
| storage-provisioner         | minikube | enabled ✅   | Google                         |
| storage-provisioner-gluster | minikube | disabled     | 3rd party (Gluster)            |
| volumesnapshots             | minikube | disabled     | Kubernetes                     |
|-----------------------------|----------|--------------|--------------------------------|


## Minikube ingress cannot be access from Host OS

1/27 (Day 3):

Ubuntu上では、ingressを介してアクセスできることが確認できた。

確認手順：

/etc/hostsへ次を全部追記する

```
127.0.0.1 posts.com
localhost posts.com
$(minikube ip) posts.com
```

```bash
$ minikube start
$ kubectl get services
$ kubectl get ingress
$ kubectl get pods -n ingress-nginx
$ kubectl logs <each-pod-services>

# 別窓を開いて
# 
# posts-srvだけ公開して、postsmanからpostsへ何件か投稿させる
$ minikube service posts-srv --url
http://127.0.0.1:3xxxxx
```

新規で/postsへ何件か投稿して...

```bash
# 別窓
$ minikube tunnel
```

```bash
# 本窓
$ curl posts.com/posts
```

上記のコマンドの結果として、先ほど投稿した投稿内容が返ってきた。

なのでUbuntuからはアクセスできているみたい。

ただし、ホスト側からはどうしてもアクセスできない。

windows側でport80番を利用しているすべてのプロセスを切るしてからも同様である。

ひとまずだけど、学習するうえで問題になったらまたこの問題に直面することとして、

もう放置でいいや。


## IngressNginx の config ファイルについて

[config ファイル：実例と記述内容の解釈](#configファイル：実例と記述内容の解釈)より、

たぶんここに従えばいいのかと。

https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.26/#ingressclass-v1-networking-k8s-io

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-srv
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  rules:
    - host: posts.com
      http:
        paths:
          - path: /posts
            pathType: Prefix
            backend:
              service:
                name: posts-clusterip-srv
                port:
                  number: 4000
```

https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.26/#objectmeta-v1-meta

`metadata:name:`: 

namespaceの中で一意でなくてはなりません。リソースを生成するときに必須でありる。
名前は主に、作成時のべき等と構成定義のために使用される。更新はできない。


`metadata:annotations:`:

アノテーションは、リソースとともに保存される非構造化キー・バリュー・マップであり、任意のメタデータを保存・取得するために外部ツールによって設定されることがある。これらは問い合わせができないため、オブジェクトを変更する際には保存しておく必要がある。

つまり、

`metadata:name:`は任意につけることができる。ただし、namespaceの中で一意でなくてはならない。

`metadata:annotations:`は外から引っ張ってくる情報である。

`IngressClassSpec`:

https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.26/#ingressclassspec-v1-networking-k8s-io



## Ingress

https://kubernetes.io/ja/docs/concepts/services-networking/ingress/

> Ingress はクラスター外からクラスター内 Service への HTTP と HTTPS のルートを公開します。トラフィックのルーティングは Ingress リソース上で定義されるルールによって制御されます。

つまりロードバランサーはクラスターの外側に存在する。

クラスターへの通信リクエストは、すべてロードバランサーを通して行われる。

Ingress を使用するには Ingress コントローラが必要である。

Ingress コントローラのひとつが ingress-nginx である。

#### 最小限の Ingress リソースの構成内容

下記の通り、Ingress は deploument や pod などの kind のひとつである。

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: minimal-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx-example
  rules:
    - http:
        paths:
          - path: /testpath
            pathType: Prefix
            backend:
              service:
                name: test
                port:
                  number: 80
```

## そもそも yaml ファイルは何を書けばいいのか？

https://kubernetes.io/ja/docs/concepts/overview/working-with-objects/kubernetes-objects/

Kubernetes オブジェクトは Kubernetes 上で永続的な存在である。

Kubernetes オブジェクトは「意図の記録」である。一度オブジェクトを作成すると、kubernetes は常にそのオブジェクトが存在し続けるように動く。

オブジェクトを作成することで、Kubernetes に対し効果的にあなたのクラスターのワークロードがこのようになっていて欲しいと伝えているのです。

ではオブジェクトはこうであってほしいとどう伝えればいいのか？

#### spec と status

ほとんどの Kubernetes オブジェクトは、

オブジェクトどういうものであってほしいのか、どういう状態でいてほしいのかを定めるフィールドを持つことになる。

それが`spec`と`status`である。

spec: 望ましい状態としてオブジェクトに持たせたい特徴を記述するフィールド

status: オブジェクトの現在の状態を示し、kubernetes によってその状態を監視、更新され、指定された望ましい状態になるように管理される。

ということで、

開発者が手を付けられる、そのオブジェクトがどうあってほしいのかを(config ファイルで)記述できるのが spec で、

そのオブジェクトが今どんな状態なのか稼働中の状態を示すのが status である。

status は config ファイルで記述されるものではなくて今現在オブジェクトがどういう状態なのか kubernetes によって内部的に更新される値である。

#### 詳細な説明

https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md

#### config ファイル：実例と記述内容の解釈

config ファイルは、

オブジェクトの基本情報

そのオブジェクトの spec

を記述しなくてはならない。

```yaml
# -- 必須フィールド --
#
# apiVersion: どのバージョンのKubernetesAPIを利用してオブジェクトを作成するのか
# kind: どの種類のオブジェクトを作成するのか
# metadata: オブジェクトを一位に特定するための情報
#   name, UID, namesapceを指定して一意の文字列を渡す。
# spec: オブジェクトの望ましい状態
# -------------------
apiVersion: apps/v1 # for versions before 1.9.0 use apps/v1beta2
kind: Deployment
metadata:
  name: nginx-deployment
#
# specの内容は、オブジェクトごとに異なるよ
#
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 2 # tells deployment to run 2 pods matching the template
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.14.2
          ports:
            - containerPort: 80
```

spec の正確なフォーマットは Kubernetes オブジェクトごとに異なり、オブジェクトごとに特有の入れ子フィールドを持つので、

各オブジェクトごとにどうなっているべきかを調べる必要がある。

kubernetes API リファレンスがすべての Kubernetes オブジェクトに関する spec のフォーマットを探すのに役立つとのこと。

https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.26/


## Deploying the React App

`create-react-app`はDockerコンテナの中で実行するとバグが起きるらしい。

なので次のようにblog/client/のDockerfileに追記する。

```Dockerfile
FROM node:16-alpine
 
# Add the following lines
ENV CI=true
ENV WDS_SOCKET_PORT=0
 
WORKDIR /app
COPY package.json ./
RUN npm install
COPY ./ ./
 
CMD ["npm", "start"]
```

先までの講義で

```yaml
# ingress-srv.yaml
# ...
spec:
  rules:
    # - host: posts.com
    - host: my-app.org
```
というドメインにしていたけれど、

これはクラスターの中で分かればいいので任意に変えても大丈夫

/etc/hosts

```
127.0.0.1 my-app.org
```

本筋に戻って。

ReactAppをpodに展開するので、コード内のURLを更新する

```JavaScript
// CommentCreate.js
const CommentCreate = ({ postId }) => {
    const [content, setContent] = useState('');

    const onSubmit = async (event) => {
        event.preventDefault();

        // await axios.post(`http://localhost:4001/posts/${postId}/comments`, {
        await axios.post(`http://posts.com/posts/${postId}/comments`, {
            content
        })
        .catch(e => console.error(e.message));

        setContent('');
    };
  // ...
};
// 他のファイルも同様に...
```

あとはdockerイメージの生成とクラスターへのデプロイである。

```bash
$ cd blog/client
$ docker build -t $username/client .
$ docker push $username/client
$ cd infra/k8s
$ touch client-depl.yaml
# 内容を編集して...
$ kubectl apply -f client-depl.yaml
```

他のサービスのdeploymentの内容とほぼ同じ

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
    name: client-depl
spec:
    replicas: 1
    selector: 
        matchLabels:
            app: client
    template:
        metadata: 
            labels:
                app: client
        spec: 
            containers: 
              - name: client
                image: kabooley/client
---
apiVersion: v1
kind: Service
metadata:
    name: client-srv
spec:
    selector:
        app: client
    ports: 
        - name: client
          protocol: TCP
          port: 3000
          targetPort: 3000
```

#### Unique Route Path

想定されるリクエストとリクエストの到達先

以下の内容をすべてingressの設定ファイルに書き出す必要がある

```
--------------------
|ingress controller|  --> |
--------------------      |
                          |--- POST /posts        -->       | POD Posts |
                          |--- POST /posts/:id/comments --> | POD Comments |
                          |--- GET /posts          -->      | POD Query |
                          |                                 | POD Moderation |
                          |--- POST /              -->      | POD React |
```

問題がある。

ingressはリクエストのメソッドに応じてルーティングをすることができない！

つまりPOSTかGEtか判断できないのである。

となると同じpathだと区別できない。

これを解決するために完全に区別がつくパスに変更する必要があるとのこと。

`POST /posts`を`POST /posts/create`にするなど。

```JavaScript
// PostCreate.js

const PostCreate = () => {
    const [title, setTitle] = useState('');

    const onSubmit = async (event) => {
        event.preventDefault();

        console.log(`post`);
        console.log(title);

        // pathの変更
        await axios.post('http://posts.com/posts/create', {
            title
        })
        .catch(e => {
            console.error(e);
        });

        
        setTitle("");
    };
    // ...
};

// posts/index.js

// pathの変更
app.post('/posts/create', async (req, res) => {
    const id = randomBytes(4).toString('hex');
    const { title } = req.body;
    
    posts[id] = {
        id, title
    };

    console.log(posts[id]);

    await axios.post('http://event-bus-srv:4005/events', {
        type: 'PostCreated',
        data: {
            id, title
        }
    });

    res.status(201).send(posts[id]);
});
```

これを反映

```bash
$ cd blog/client
# postsとclientのイメージ作成とプッシュ、ロールアウトリスタート(client-depl)
$ docker build -t $username/client .
```
