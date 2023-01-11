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

## Dockerを起動

次のコマンドが必要かも。

```bash
$ sudo service docker start
```

TODO: `docker login`拒否される

参考

https://docs.docker.com/engine/reference/commandline/login/

あとpassテキストファイルのstdinもパーミッションのせいでアクセスできない