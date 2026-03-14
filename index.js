const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// RailwayがDATABASE_URLという環境変数を自動でセットしてくれる
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// テーブルがなければ作成 & 初期データ投入
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id    SERIAL PRIMARY KEY,
      title TEXT    NOT NULL,
      done  BOOLEAN NOT NULL DEFAULT false
    )
  `);

  const { rows } = await pool.query('SELECT COUNT(*) as cnt FROM todos');
  if (parseInt(rows[0].cnt) === 0) {
    const initialTodos = [
      ['牛乳を買う', true],
      ['部屋を掃除する', false],
      ['読書：Clean Code 第1章', true],
      ['メールの返信をする', false],
      ['請求書を送る', false],
      ['歯医者の予約を入れる', true],
      ['Gitの使い方を復習する', false],
      ['洗濯をする', true],
      ['Node.jsのドキュメントを読む', false],
      ['友達に電話する', false],
      ['領収書を整理する', true],
      ['新しいレシピを試す', false],
      ['ジムに行く', true],
      ['プレゼン資料を作る', false],
      ['銀行口座の残高を確認する', false],
      ['観たい映画をリストアップする', true],
      ['パスワードを変更する', false],
      ['植物に水をやる', true],
      ['ランニング30分', false],
      ['APIの勉強を続ける', false],
    ];
    for (const [title, done] of initialTodos) {
      await pool.query('INSERT INTO todos (title, done) VALUES ($1, $2)', [title, done]);
    }
  }
}

initDB();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello!' });
});

// 全件取得
app.get('/api/todos', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM todos ORDER BY id');
  res.json(rows);
});

// 1件取得
app.get('/api/todos/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM todos WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
  res.json(rows[0]);
});

// POST: 新規作成
app.post('/api/todos', async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: 'title is required' });

  const { rows } = await pool.query(
    'INSERT INTO todos (title) VALUES ($1) RETURNING *',
    [title]
  );
  res.status(201).json(rows[0]);
});

// PUT: 更新
app.put('/api/todos/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM todos WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Not found' });

  const todo = rows[0];
  const title = req.body.title !== undefined ? req.body.title : todo.title;
  const done  = req.body.done  !== undefined ? req.body.done  : todo.done;

  const { rows: updated } = await pool.query(
    'UPDATE todos SET title = $1, done = $2 WHERE id = $3 RETURNING *',
    [title, done, req.params.id]
  );
  res.json(updated[0]);
});

// DELETE: 削除
app.delete('/api/todos/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM todos WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ message: 'Not found' });
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
