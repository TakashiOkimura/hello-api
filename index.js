const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3000;

// ① DBファイルを開く（なければ自動で作られる）
const db = new Database('todos.db');

// ② テーブルがなければ作成する
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT    NOT NULL,
    done  INTEGER NOT NULL DEFAULT 0
  )
`);

// ③ テーブルが空のときだけ初期データを入れる
const count = db.prepare('SELECT COUNT(*) as cnt FROM todos').get();
if (count.cnt === 0) {
  const insert = db.prepare('INSERT INTO todos (title, done) VALUES (?, ?)');
  const initialTodos = [
    ['牛乳を買う', 1],
    ['部屋を掃除する', 0],
    ['読書：Clean Code 第1章', 1],
    ['メールの返信をする', 0],
    ['請求書を送る', 0],
    ['歯医者の予約を入れる', 1],
    ['Gitの使い方を復習する', 0],
    ['洗濯をする', 1],
    ['Node.jsのドキュメントを読む', 0],
    ['友達に電話する', 0],
    ['領収書を整理する', 1],
    ['新しいレシピを試す', 0],
    ['ジムに行く', 1],
    ['プレゼン資料を作る', 0],
    ['銀行口座の残高を確認する', 0],
    ['観たい映画をリストアップする', 1],
    ['パスワードを変更する', 0],
    ['植物に水をやる', 1],
    ['ランニング30分', 0],
    ['APIの勉強を続ける', 0],
  ];
  initialTodos.forEach(([title, done]) => insert.run(title, done));
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello!' });
});

// 全件取得
app.get('/api/todos', (_req, res) => {
  const todos = db.prepare('SELECT * FROM todos').all();
  // DBのdoneは 0/1 なのでtrue/falseに変換
  res.json(todos.map(t => ({ ...t, done: t.done === 1 })));
});

// 1件取得
app.get('/api/todos/:id', (req, res) => {
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
  if (!todo) return res.status(404).json({ message: 'Not found' });
  res.json({ ...todo, done: todo.done === 1 });
});

// POST: 新規作成
app.post('/api/todos', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: 'title is required' });

  const result = db.prepare('INSERT INTO todos (title) VALUES (?)').run(title);
  const newTodo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...newTodo, done: false });
});

// PUT: 更新
app.put('/api/todos/:id', (req, res) => {
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
  if (!todo) return res.status(404).json({ message: 'Not found' });

  const title = req.body.title !== undefined ? req.body.title : todo.title;
  const done  = req.body.done  !== undefined ? (req.body.done ? 1 : 0) : todo.done;

  db.prepare('UPDATE todos SET title = ?, done = ? WHERE id = ?').run(title, done, req.params.id);
  const updated = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
  res.json({ ...updated, done: updated.done === 1 });
});

// DELETE: 削除
app.delete('/api/todos/:id', (req, res) => {
  const result = db.prepare('DELETE FROM todos WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Not found' });
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
