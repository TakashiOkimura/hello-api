# hello-api

Node.js + Express + SQLite で作ったシンプルなTodo API。

## 起動方法

```bash
npm install
node index.js
```

http://localhost:3000 をブラウザで開く。

## APIエンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| GET | /api/todos | 全件取得 |
| GET | /api/todos/:id | 1件取得 |
| POST | /api/todos | 新規作成 |
| PUT | /api/todos/:id | 更新 |
| DELETE | /api/todos/:id | 削除 |
