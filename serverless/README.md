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

## deploy

Github Actionsを使い、`master`ブランチにpushされたものは自動的にAWS LambdaにDeployされるようになっています
deployのレシピについては[こちら](/.github/workflows)より確認できます。
Github ActionsによるDeployの様子は[こちら](https://github.com/TakuKobayashi/TwilioHackathon2022/actions)より確認ができます。

## deploy先の確認方法
AWS Lambdaに反映されたものの確認方法は以下の通りのURLにて確認できます。

`https://s5bicmgli7.execute-api.ap-northeast-1.amazonaws.com/production/パス名`

とりあえず、以下のURLにアクセスすると何か表示されます

https://s5bicmgli7.execute-api.ap-northeast-1.amazonaws.com/production/test

## 環境変数

`.env.sample` に記載されているような、`TWILIO_ACCOUNT_SID` や `TWILIO_AUTH_TOKEN`のように該当する内容を`.env` ファイルの中に値を記述するようにしてください。