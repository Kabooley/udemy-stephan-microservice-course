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