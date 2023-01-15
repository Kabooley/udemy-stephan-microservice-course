# Note: Basic of Docker

## Why we use Docker?

#### What is Docker?

日本人はこの記事を読めばイメージがつかめるのでは？

https://tech-lab.sios.jp/archives/18811

講義に戻って。

Dockerはコンテナを構築・管理するためのエコシステムである。

`image`: Single file with all the deps and config required to run a program.

## Installation

Ubuntuにインストールするなら：

https://docs.docker.com/engine/install/ubuntu/#prerequisites

#### Installation docker-compose 

https://docs.docker.com/compose/install/other/

https://github.com/circleci/circleci-docs/issues/1323

https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-compose-on-ubuntu-20-04

```bash
# 公式の方法其のままだとパーミッションエラーになる
# なので一旦ダウンロードを済ませてから、パーミッションを付与する
$ curl -L https://github.com/docker/compose/releases/download/v2.15.1/docker-compose-`uname -s`-`uname -m` > ~/docker-compose
$ chmod +x ~/docker-compose
$ sudo mv ~/docker-compose /usr/local/bin/docker-compose
$ docker-compose run test

# `-L`: リダイレクト先までアクセスする
# `-S`: 進捗を表示しない
# `uname -s`: 
# `uname -m`: 

$ docker-compose --version
```

ひとまず--versionでバージョン確認できているしDLはできている

## Dockerを起動

次のコマンドが**毎度**必要かも。

```bash
$ sudo service docker start
```

## What is Container?

#### ホストOS上のプログラムの動作

まずコンピュータとソフトウェアがどのように動作しているのか知る必要がある。

コンピュータはカーネルがハードウェアに命令を出して、CPUやメモリやハードディスクが動作する。

カーネルはプロセスと呼ばれる実行中のプログラムともやり取りする。

そのやり取りはプロセスからシステムコールというカーネルを動かす命令によってカーネルが動作して、その命令通りハードウェアを動かす。

つまり、

実行中のプログラムはOS上のカーネルにこうしてくれと依頼し、カーネルはそれに従ってハードウェアを動かす

こうしてプログラムは動いているのである。

`process --> SystemCall --> Kernel --> hardware`

こんな感じ。

#### コンテナ

コンテナとは、ホストOS上で動作するプロセスの一つである。

つまり先の話にでてきたプロセスと、OSからみたら同じなのである。

なので、コンテナは他のプロセス同様ホストOSを共有するのである。

##### namespace

同一のOS上で複数の同一プログラムが実行できる仕組みについて

同一のOS上で同一のプログラムが複数実行されているとする。

TODO: 同じプログラムが同一のOS上で動かせる仕組みについてまとめ

TODO: namespaceについてまとめ

namespace: `Isolating resources per process`


#### コマンド：override default command

```bash
# `bustybox`にはechoプログラムが含まれているので`echo`が実行できる
$ docker run bustybox echo hi there
# `hello world`にはechoプログラムが存在しないので実行できない
$ docker run hello world

# 実行中のdockerコンテナを表示する
$ docker ps
# これまでに作成したすべてのコンテナを表示する
$ docker ps
```

#### container lifecycle

コンテナのライフサイクル。

- コンテナの開始

```bash
$ docker run <docker-image>
```

https://docs.docker.com/engine/reference/commandline/run/

書き込み可能なコンテナ層を指定のイメージに対して生成して、そのコンテナを開始する。

このように、

docker runは`/containers/create`から`/containers/(id)/start`するのと同じことである

- コンテナの生成

```bash
$ docker create <image-name>
```

https://docs.docker.com/engine/reference/commandline/create/

新規のコンテナの生成。

書き込み可能なコンテナの層を生成して、stdoutへそのコンテナのIDを出力する。

このあとdocker start <container-id>することで生成したコンテナを開始することができる。

- コンテナの開始

```bash
# docker container createの短縮版である
$ docker start <container-id>
```

生成済のコンテナ層を開始することができる。その指定方法はコンテナのIDを指定するか

- コンテナの停止

```bash
$ docker run <docker-image>
```

https://docs.docker.com/engine/reference/commandline/stop/

とにかくコンテナを停止させると。

`SIGTERM`信号を、コンテナ内部のメインプロセスが取得し、猶予期間ののち`SIGKILL`信号を取得する。

よく`docker pause vs docker stop`の比較がなされるようである。

受け取る信号が異なるようである。

docker pauseは`SIGSTOP`を受け取る。

参考:

https://stackoverflow.com/questions/51466148/pause-vs-stop-in-docker

要は、

`SIGTERM`: 終了準備してね

`SIGKILL`: 終了してね

`SIGSTOP`: 停止してね

の信号をプロセスへ送信しているのである。

- 停止中の**すべての**コンテナの削除

NOTE: `SIGTERM`して10秒たっても終了しなかったら強制的にプロセス切るさせられるらしい。

```bash
$ docker system <docker-image>
```

https://docs.docker.com/engine/reference/commandline/system_prune/

停止中のすべてのdocker コンテナの削除。

dockerをまったく使わなくなったとか、容量を確保したいときに便利。


```bash
$ docker run <docker-image>
```

#### オプション：よく使いそうなやつ


- `-a`: 実行するコンテナの出力先をターミナルに指定する

https://docs.docker.com/engine/reference/commandline/start/#options

> Attach STDOUT/STDERR and forward signals

```bash
$ docker start -a xxxxxxxxxx
```

## `docker`コマンドのパーミッション変更

https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user

*要は現状`sudo`を接頭辞にしなくてはならない*

```bash
$ which docker
/usr/bin/docker
$ ls -l /usr/bin/docker
-rwxr-xr-x 1 root root 50722328 Dec 16 07:25 /usr/bin/docker
```

ということで、なんと現状rootユーザにしか権限がないので

```bash
$ docker ps
Got permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Get "http://%2Fvar%2Frun%2Fdocker.sock/v1.24/containers/json": dial unix /var/run/docker.sock: connect: permission denied
```

となる。

パーミッションの付与。

> Docker daemonはUNIX socketにバインドされており、UNIX socketはrootユーザのみが所持している。
> rootユーザ以外がdockerを使うにはsudoが必須になる

> sudo抜きにしたいなら`docker`というグループを追加して...

とのことなのでそのままガイドに従って

```bash
$ sudo groupadd docker
# $USERはユーザ名
$ sudo usermod -aG docker $USER
# 一旦ログアウト。再ログインして
$ docker run hello-world
# sudoなしで実行できた
```

#### `docker logs`: `-a`フラグなしでコンテナからの出力を取得する方法

```bash
$ docker logs <container-id>
```

-aフラグを付けて実行することをうっかり忘れたときに。

#### dockerコンテナの停止方法

`^C`なしで。

```bash
$ docker start xxxxsomecontaineridxxxx
xxxxsomecontaineridxxxx

$ docker log xxxxsomecontaineridxxxx
# you can get specified id container log running background.

$ docoker stop xxxxsomecontaineridxxxx
```

#### よく使うかも

```bash
# コマンドはどこにある？
$ which docker-compose
/usr/local/docker-compose

# 権限はどうなっている？
$ ls -l /usr/local/docker-compose
-rx-rx--x root root ...
```

## マルチ・コマンド・コンテナ

OSSの`redis server`をdockerで実行させてみる。

redis serverは対話型のDBで、redisサーバと対話するためのCLIをプログラム中に実行することで対話が実現されている。

つまり、

redisサーバ自体と、redis cliの2つのプロセスが必要なのである。

redisサーバをdocker　statさせたらどうやってredis cliをターミナルに呼び出せばいいのあか？

```bash
# start redis server
$ docker run redis
...
# 入力を受け付けるようになっているけれど...
redis-cli
# 上記のコマンドが実行されるわけではない...
```

ターミナル別窓を開いて

```bash
$ docker run redis-cli
# そんなコンテナはないといわれる
```
当然である。redi cliはredis serverの中で実行されているからである。


#### `docker exec`

docker containerのなかで追加のコマンドを実行するために使用する。

```bash
# In another terminal window...
$ docker ps
# Now you can make sure running redis server...
$ docker exec -it xxxredisservercontaineridxxxx redis-cli
# 実行できた！
127.0.0.193> 
```

つまりこうである。

```bash
$ docker exec -it <container-id> <command-contaier-includes>
```

https://docs.docker.com/engine/reference/commandline/exec/

> The docker exec command runs a new command in a running container.



#### `-it` flag

要は

「現在使っているターミナルで」、「出力内容をターミナルに表示させる」。

先のコマンドでいえば

「<container-id>の実行出力内容をこのターミナルに指定する」という命令である。

https://docs.docker.com/engine/reference/commandline/exec/#options

`--interactive`: KEEP STDIN open even if not attatched.

`--tty`: Allocate a pseudo-TTY

wtf `pseudo-TTY`?

https://unix.stackexchange.com/a/21149

#### Getting command prompt in container.

コンテナ内でコマンドを実行する方法を学習した。

ところでコンテナ内でたくさんコマンドを実行しなくてはならないときに、

そのたびに別窓を開いてdocker exec しなくてはならないのだろうか？

非常に面倒である。

コマンドごとに別窓を開くのではなくて、

そのコンテナのコマンドプロンプト自体を取得してしまえばよい。

```
$ docker exec -it xxxsomeawesomeidxxxx sh
# cd ~/
# ls
bin data etc ...
# redis-cli
127.0.0.93> ...
# ^C
```

https://docs.docker.com/engine/reference/commandline/exec/#examples

`sh`: そのcontainer-idコンテナのインタラクティブshell実行してくれる。

> This starts a new shell session in the container mycontainer.

終了させたいときはCtrl Cまたはシェルで`exit`と入力することで終了させる。

#### Starting wiht a Shell

```bash
$ docker run -it <image-name> sh
```

「このターミナルで実行結果を出力させて、インタラクティブシェルも呼出す」

#### Isolating Container

今同じドッカーイメージを二つのコンテナで実行されているとする。

両コンテナはファイルシステムを共有するのか？

結論として、コンテナはそれぞれ独立なので共有されることはあり得ない。

```bash
# terminal 1
$ docker run -it busybox sh
/# ls
bin dev etc...
/# touch new-file.txt
ls 
bin dev etc new-file.txt...
```
```bash
# terminal 2
# 同じdockerイメージを別のコンテナで実行する
$ docker run -it busybox sh
/# ls
bin dev etc...
```
ターミナル2の方では`new-file.txt`は存在しない。

## Dockefile and build

#### Creating Docker image

`DockerFile`: Configuration to define how our container should behave.

DockerFile --> DockerClient --> DockerServer --> UsabeImage!

どっかーファイルを生成する流れ：

- ベースイメージの決定
- 追加のプログラムを得るためにコマンドを実行する
- コンテナをセットアップするための実行コマンドの決定

これ以降の講義では、

`redis-server`を実行するコンテナイメージの生成が目標となる。

`./redis-image`

```dockerfile
# use and exsigting docker image as a base
FROM alpine
# Donwload and install a dependency
RUN apk add --update redis

# Tell the image what to do when it starts as a container
CMD ["redis-server"]
```

```bash
$ cd redis-image/
$ docker build .
# ...
Successfully Built. xxxximageidxxxx
$ docker run xxximageidxxxx
```

#### Dockerfile

参考：

https://docs.docker.jp/develop/develop-images/dockerfile_best-practices.html

中身の意味

```Dockerfile
# とくに重要な中心的なDockerfile命令文３つ
FROM alpine

RUN apk add --update redis

CMD ["redis-server"]
```

Dockerfileを書くということは：

≒**OSのないコンピュータを渡されてChromeをインストールする**のと同じことである。

つまり、Dockerfileに書く内容は空っぽのPCをまずスタートラインとして捉えるべきであるということになる。

`docker build <dockerfile>`の実行とは：

要は(Dockerfile命令の)各段階のスナップショットをとっていき、そのスナップショットをあつめてdocker イメージとすることである。

FROM:

Dockerfileはdockerイメージを生成するための礎である。

イメージの土台は可能な限り公式のありものを使うのが通例である。

alpineは公式が管理しているLinuxディストリビューションである。

つまりLinuxをインストールするところから始めているのである。

RUN:

RUNで指定した値はシェル内で実行される。

実行結果は確定されたイメージということで次のステップで使用される。

CMD:

コンテナ実行時のデフォルトを指定するためにある。

配列形式で、要素は実行する実行ファイルやパラメータとなる。

CMD命令はDockerfileで一度しか使うことが許されない。複数CMDがあったとしたら最後のCMDのみ有効である。

#### 簡単な要約 Quick recap

`FROM alpine`: Download alpine image

`RUN apk add --update redis`: 

    - 前回のステップで生成されたイメージを取得する
    - そこから(一時的な)コンテナを生成する
    - そのコンテナの中で`apk add --update redis`を実行する
    - そのコンテナのファイルシステムのスナップショットを取得する
    - 一時的なコンテナを閉じる
    - 取得したスナップショットを次のステップで使うイメージとしてとっておく

`CMD ["redis-server"]`

    - 前回のステップで生成されたイメージを取得する
    - そこから(一時的な)コンテナを生成する
    - コンテナに起動時に"redis-server"を実行するように伝える
    - そのコンテナのファイルシステムのスナップショットを取得する
    - そうして実行時のデフォルトコマンドを実行した時のコンテナのファイルシステムのスナップショットを取得する
    - 一時的なコンテナを閉じる
    - 取得したスナップショットを次のステップで使うイメージとしてとっておく


#### Use Cache

いま新たに`RUN apk add --update gcc`を追加するとする。

```Dockerfile
FROM alpine

RUN apk add --update redis

RUN apk add --update gcc

CMD ["redis-server"]
```

```bash
Sending build context to Docker daemon  2.048kB
Step 1/4 : FROM alpine
 ---> 042a816809aa
Step 2/4 : RUN apk add --update redis
# NOTE `using chache`とある
# 
# そのため、依存関係を取得するためのfetch等がない
 ---> Using cache
 ---> 297454cdd30c
Step 3/4 : RUN apk add --update gcc
 ---> Running in f06b337b9f12
fetch https://dl-cdn.alpinelinux.org/alpine/v3.17/main/x86_64/APKINDEX.tar.gz
fetch https://dl-cdn.alpinelinux.org/alpine/v3.17/community/x86_64/APKINDEX.tar.gz
(1/10) Installing libgcc (12.2.1_git20220924-r4)
# 
# 中略
# 
(10/10) Installing gcc (12.2.1_git20220924-r4)
Executing busybox-1.35.0-r29.trigger
OK: 145 MiB in 26 packages
Removing intermediate container f06b337b9f12
 ---> 5f94ea20d4c9
Step 4/4 : CMD ["redis-server"]
 ---> Running in cdfe1e23007f
Removing intermediate container cdfe1e23007f
 ---> 7428e4269f8e
Successfully built 7428e4269f8e
```

たとえばここからさらにDockerfileを変更しないでdocker buildすると、

すべてキャッシュを使われたりするのでfetchなど完全に行われない

順番を変くしてみたら？

```Dockerfile
FROM alpine
# gccを先にしたら
RUN apk add --update gcc

RUN apk add --update redis

CMD ["redis-server"]
```

この場合、gccをインストールするためにfetchが起こる

```bash
Sending build context to Docker daemon  2.048kB
Step 1/4 : FROM alpine
 ---> 042a816809aa
Step 2/4 : RUN apk add --update gcc
 ---> Running in d357b122c128
fetch https://dl-cdn.alpinelinux.org/alpine/v3.17/main/x86_64/APKINDEX.tar.gz
fetch https://dl-cdn.alpinelinux.org/alpine/v3.17/community/x86_64/APKINDEX.tar.gz
(1/10) Installing libgcc (12.2.1_git20220924-r4)
# 
# 中略
# 
(10/10) Installing gcc (12.2.1_git20220924-r4)
Executing busybox-1.35.0-r29.trigger
OK: 142 MiB in 25 packages
Removing intermediate container d357b122c128
 ---> 40d636e946be
Step 3/4 : RUN apk add --update redis
 ---> Running in e1cb4a0d63ca
(1/1) Installing redis (7.0.7-r0)
Executing redis-7.0.7-r0.pre-install
Executing redis-7.0.7-r0.post-install
Executing busybox-1.35.0-r29.trigger
OK: 145 MiB in 26 packages
Removing intermediate container e1cb4a0d63ca
 ---> 72aa5ce41a4c
Step 4/4 : CMD ["redis-server"]
 ---> Running in 5fe58dae4345
Removing intermediate container 5fe58dae4345
 ---> 0a526186a685
Successfully built 0a526186a685
```

## Tagging image

イメージにタグ付けする。

https://docs.docker.com/get-started/02_our_app/#build-the-apps-container-image

Running `docker build -t getting-started .`.

> Finally, the -t flag tags your image. Think of this simply as a human-readable name for the final image. Since you named the image getting-started, you can refer to that image when you run a container.

「これは単に人間がどっかーイメージ（の名前）を理解しやすくするための措置です」

```bash
$ docker build -t stephangrinder/redis:latest .
# Tag name is concisted of...
# 
# Docker ID: stephangrinder
# Repo/project name: redis
# Version: latest
```

## `docker commit`

これまでの話。

イメージからコンテナを生成する話。

では、

逆にコンテナからイメージを生成することはできるのか？

できるらしい。

例えばこんな時。

alpineだけのイメージからコンテナを実行して、

実行中のコンテナの中で手動で依存関係をインストールした場合。

```bash
$ docker run -it alpine sh
#/ apk add --update redis
fetch htt://dl....
#/ 
```
https://docs.docker.com/engine/reference/commandline/commit/

> Create a new image from a container’s changes

> 「コンテナの変更を反映したあらたなイメージを生成します」

> It can be useful to commit a container’s file changes or settings into a new image.

> 「コンテナのファイルの変更や設定を新しいイメージにコミットすると便利です。」

NOTE: `docker commit`は一般的に使わない方がよい

> Generally, it is better to use Dockerfiles to manage your images in a documented and maintainable way.

つまり、

`docker commit`は、奥の手という位置づけのdockerimageを変更する手段である。

```bash
# さきのつづきということで...
$ docker commit -c 'CMD ["reds-server"]' <container-id>
# commmitするとあらたなイメージのidが出力される
sha256:xxxxxxnew-image-idxxxxxx
$ docker run xxxxxxnew-image-idxxxxxx
# 本来のDockerfileの内容通りに動作した
```

TODO: ここまでの話を、公式の説明を確認しながらまとめる。

Dockerfileをビルドするときに裏側で行われていることなど。

