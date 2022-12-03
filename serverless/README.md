# 開発の始め方

1. yarnをインストールしてきてください
2. `yarn install` を実行してライブラリをインストールしてください
3. `.env.sample` を `.env` にコピーしてください(+該当の環境変数を入力していってください)
4. とりあえずローカルサーバーを立ててみる

```
yarn run serverless offline start
```

これでローカルサーバーが立ち上がります。
4. ローカルサーバーが立ち上がったら http://localhost:3000/dev/test にアクセスすると何か表示されます

# 開発について

## 使用している開発環境

* Node.js
* (Typescript)
* Serverless Framework
* AWS Lambda
* [Express](https://expressjs.com/ja/) (serverless Express)

## 主に開発している場所

`src/index.ts` を起点に開発を進めて行きます