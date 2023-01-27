# What is Ingress?

https://kubernetes.io/docs/concepts/services-networking/ingress/

特にHTTPでの、クラスター内部への外部からのアクセスを管理するAPIオブジェクトである。

IngressはLoadBalancer機能や、SSLターミネーション、名前ベースの仮想ホスティング機能を提供する。

## Terminology

- エッジ ルーター: クラスターにファイアウォール ポリシーを適用するルーター。これは、クラウド プロバイダーまたは物理的なハードウェアによって管理されるゲートウェイである可能性があります。 


## What is Ingress ?

> Ingress は、サービスに外部から到達可能な URL を与える、トラフィックの負荷を分散する、SSL / TLS を終了する、名前ベースのバーチャルホストを提供する、などの目的で設定することができます。Ingress コントローラーは、通常ロードバランサーを使用して Ingress を満たしますが、エッジルーターや追加のフロントエンドを設定してトラフィックの処理を支援することもあります。

> Ingressは、任意のポートやプロトコルを公開するものではありません。HTTPやHTTPS以外のサービスをインターネットに公開するには、通常Service.Type=NodePortやService.Type=LoadBalancerといったタイプのサービスを使用します。

## Prerequisities

ingress-nginxを使っているので、

https://kubernetes.github.io/ingress-nginx/deploy/

上記の公式説明を読め。そのうえで進めろ。

とのこと。


NGINX ingressをインストールする方法はいくつかあって、

自分が実行した方法は....とりあえず正しいらしいので割愛。

## Ingress Resources

最小構成

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

ingressの必須フィールドとして

- apiVersion
- kind
- metadata
- spec

いつも通りですな。

metadata:nameは有効なDNS subdomain nameでなくてはならない

ingressは`annotations:`ingress-controllerの依存関係のオプションを構成する。

ingress-controllerが異なればサポートするオプションも異なる。

`spec`には