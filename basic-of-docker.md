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

#### よく使うかも

```bash
# コマンドはどこにある？
$ which docker-compose
/usr/local/docker-compose

# 権限はどうなっている？
$ ls -l /usr/local/docker-compose
-rx-rx--x root root ...
```