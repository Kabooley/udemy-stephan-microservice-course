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
# 確認
$ kubectl version --client
# 設定の検証
$ kubectl cluster-info
# The connection to the server <server-name:port> was refused - did you specify the right host or port?

# minikubeが必要であるということらしい
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