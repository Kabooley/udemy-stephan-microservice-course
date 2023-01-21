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

    axios.post("http://localhost:4000/events", event).catch((err) => {
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

TODO: 原因の追究

## Minikubeで実行中のNodePortサービスURLにアクセスできないとき

https://stackoverflow.com/questions/40767164/expose-port-in-minikube

https://www.udemy.com/course/microservices-with-node-js-and-react/learn/lecture/19099832#questions/15081230

```bash
$ cd blog/posts/
$ minikube service posts-srv --url
http://127.0.0.1:39469
❗  Because you are using a Docker driver on linux, the terminal needs to be open to run it.

```

> Use the tunnel url to access the nodeport. in this case: http://127.0.0.1:64906

> Now add /posts to the url: http://127.0.0.1:64906/posts

> That made it work for me. I haven´t yet tested if they work together but at least I can access the nodeport now.

とにかくminikubeをLinuxで使う場合は、

サービスオブジェクトを生成したらポートを手動でexposeしなくてはならないようで。

```bash
$ kubectl get services
NAME                  TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
event-bus-srv         ClusterIP   10.101.89.14    <none>        4005/TCP         24h
kubernetes            ClusterIP   10.96.0.1       <none>        443/TCP          4d
posts-clusterip-srv   ClusterIP   10.96.246.193   <none>        4000/TCP         24h
posts-srv             NodePort    10.110.111.51   <none>        4000:30183/TCP   2d1h
$ kubectl expose service posts-src --type=NodePort 
```

#### `kubectl expose`:

https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#expose

新規のKubernetesサービスとしてリソースを公開する。

> デプロイメント、サービス、レプリカセット、レプリケーションコントローラ、またはポッドを名前で検索し、そのリソースのセレクタを、指定されたポート上の新しいサービスのセレクタとして使用します。デプロイメントやレプリカセットは、そのセレクタがサービスがサポートするセレクタに変換可能な場合、つまりセレクタにmatchLabelsコンポーネントだけが含まれている場合にのみ、サービスとして公開されます。
> もし --port でポートが指定されず、公開されたリソースが複数のポートを持つ場合、すべてのポートが新しいサービスによって再利用されることに注意してください。また、ラベルが指定されていない場合、新しいサービスは公開されているリソースからラベルを再利用します。

#### Create a Service

https://kubernetes.io/docs/tutorials/hello-minikube/#create-a-service

> デフォルトではpodはクラスター内部でのみそのIPアドレスにアクセスできる。

> （たとえば）`hello-worl`コンテナへ、Kubernetesのバーチャルネットワークの外部からアクセスしたい場合、podをKubernetesのサービスとして公開しなくてはならない。

手順：

1. `kubectl expose`コマンドで公開する。

```bash
$ kubectl expose service posts-srv --type=LoadBalancer --port=8080
```
`--type=LoadBalancer`:

--typeでこのServiceのタイプを指定する。タイプは`ClustIp`, `NodePort`, `LoadBalancer`, `ExternalName`。デフォルトは`ClusterIP`。


`--port=8080`: 

サービスが提供されるポート。指定されていない場合は、公開されているリソースからコピーされます

```bash

```

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

