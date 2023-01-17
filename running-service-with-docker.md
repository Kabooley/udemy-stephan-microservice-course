# Note: Seciton3: Running services with Docker


## deployの問題

現在のアプリケーションの構造をできるだけ変更せずにオンラインで公開するにはどうすればいいか

Azure? AWS? GCP?などのような仮想マシンをレンタルするのがいっぱんてき。

今、commentsサーバに負荷がかかったとする。

そんなとき負荷を減らすためにどうすればいいのか？

それはcommentsサーバを増やすことである。

問題は単純にコピーしたサーバは別々のポート番号を割り当てられることである。

現状すべてのサーバはポート番号を知っていることを前提に構築されているので

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


#### Notes of Kubernetes Config Settings