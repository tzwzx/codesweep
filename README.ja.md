# codesweep

[English](https://github.com/tzwzx/codesweep/blob/main/README.md) | 日本語

[![npm version](https://img.shields.io/npm/v/@tzwzx/codesweep.svg)](https://www.npmjs.com/package/@tzwzx/codesweep) [![license](https://img.shields.io/npm/l/@tzwzx/codesweep.svg)](./LICENSE)

lint、format、typecheck、test をはじめとするコード品質チェックのコマンドをまとめて実行します。プロジェクトごとの設定は YAML ファイルで行います。

## なぜ codesweep なのか

[concurrently](https://www.npmjs.com/package/concurrently) や [npm-run-all2](https://www.npmjs.com/package/npm-run-all2) といったタスクランナーはコマンドの並列実行を得意としていますが、「まず自動修正をかけ、そのあとすべてを並列で検証する」といった多段構成のパイプラインは、`package.json` の中で読みづらいワンライナーになりがちです。codesweep なら、パイプライン全体を 1 つの YAML ファイルで宣言し、逐次ステージと並列ステージを自由に組み合わせて、単一のコマンドで実行できます。

「品質チェックをまとめて一気に走らせたい」場面のために作られています。AI コーディングエージェントによるタスク後のチェック、コミット前フック、CI などです。ステージ内のコマンドはフェイルスルーします。1 つ失敗しても他のチェックは打ち切られないため、1 回の実行ですべてのエラーを確認できます。

まとめると、ビルドキャッシュや依存関係グラフが必要なら [wireit](https://www.npmjs.com/package/wireit) を、数個のコマンドを並列に実行したいだけなら `concurrently` 単体で十分です。宣言的で多段構成の品質チェックパイプラインが欲しいなら、codesweep が向いています。

## 動作要件

- Node.js >= 22（または Bun >= 1）

## インストール

```bash
# npm
npm install @tzwzx/codesweep

# bun
bun add @tzwzx/codesweep

# pnpm
pnpm add @tzwzx/codesweep
```

インストール後は、`npx @tzwzx/codesweep`、`bunx @tzwzx/codesweep`、`./node_modules/.bin/codesweep` のいずれかで `codesweep` バイナリを実行できます。

## CLI の使い方

```bash
codesweep <command> [options]
```

- **`init`** — カレントディレクトリに `codesweep.yml` のひな形を作成します。サブコマンドとして予約されています（後述の注記を参照）。
- **mode** — `codesweep.yml` で定義した任意のモード（例: `check` や `fix`）。
- **`--config` / `-c <path>`** — 設定ファイルのパス（デフォルト: `./codesweep.yml`）。
- **`--quiet` / `-q`** — 失敗したものだけを表示します。[Quiet mode](#quiet-mode) を参照してください。
- **`--help` / `-h`** — ヘルプを表示します。

例:

```bash
codesweep init
codesweep check
codesweep fix
codesweep check --config ./packages/app/codesweep.yml
codesweep check --quiet
```

終了コードは、成功時が `0`、失敗時が `1` です。実行が終わると経過時間が表示されます。

## Quiet mode

`--quiet` は各コマンドの出力をバッファリングし、失敗したものだけを表示します。すべて成功した実行では**出力が一切ありません**。結果は終了コードが伝えます。

```bash
codesweep check           # every tool's progress, summaries and exit lines
codesweep check --quiet   # (nothing)
```

これは CI を想定した機能です。ビルドがグリーンなのに、次に読む人が数千行の「問題は見つかりませんでした」に埋もれてしまう、という事態を避けられます。また、出力の多いアナライザーも成功している間はコストがかからないため、ログを溢れさせることなくパイプラインに入れたままにできます。

実際に失敗した場合は、失敗したコマンドごとに出力の全文が表示されます。

```
❌ Command failed: npm run typecheck
src/app.ts(12,7): error TS2322: Type 'string' is not assignable to type 'number'.

❌ codesweep check failed (8.21s)
```

すべてのコマンドは最後まで実行されるため、1 回の実行ですべてのエラーが一度に明らかになります。quiet モードが変えるのは表示される内容だけで、実行される内容は変わりません。

CI 専用のモードと組み合わせると便利です。

```yaml
check:
  - parallel:
      - npm run lint
      - npm run typecheck

check-ci:
  - parallel:
      - npm run lint
      - npm run typecheck
      - npm run test
```

```bash
codesweep check-ci --quiet
```

## ライブラリとしての使い方

codesweep はプログラムから呼び出すこともできます。`import { codesweep } from "@tzwzx/codesweep"` として `await codesweep("check")` を実行します（第 2 引数に設定ファイルのパス、第 3 引数に `{ quiet: true }` を渡すこともできます）。

## 設定ファイル: `codesweep.yml`

`init` を実行すると、カレントディレクトリに `codesweep.yml` のひな形が生成されます（同名のファイルが既に存在する場合は失敗します）。事前にインストールしていなくても実行できます。

```bash
npx @tzwzx/codesweep init

# or with bun
bunx @tzwzx/codesweep init
```

生成される内容は次のとおりです。

```yaml
# codesweep configuration
# https://github.com/tzwzx/codesweep

check:
  - parallel: # Stage 1: run checks in parallel
      - npm run lint
      - npm run typecheck
      - npm test

fix:
  - sequential: # Stage 1: apply auto-fixes
      - npm run fix
  - parallel: # Stage 2: verify after fixing
      - npm run typecheck
      - npm test
```

**モード**を 1 つ以上定義します。各モードは**ステージ**の順序付きリストです。各ステージは `parallel` か `sequential` のいずれかで、空でないシェルコマンド文字列の配列を持ちます。モード名は自由に付けられますが、`"init"` はサブコマンドとして予約されているため、モード名には使えません。

### 動作

- **ステージ**は 1 つずつ順番に実行されます（ステージ 2 はステージ 1 が終わってから始まります）。
- **ステージ内**では、`parallel` はコマンドを同時に実行し、`sequential` は順番に実行します。
- **フェイルスルー**: ステージ内の 1 つのコマンドが失敗しても、そのステージの他のコマンドは実行されます。その後、ステージ全体が失敗として扱われます。

### バリデーションルール

- 設定は空でないオブジェクトでなければなりません。
- 各モードの値はステージの配列でなければなりません。
- 各ステージは `parallel` と `sequential` のどちらか一方だけを持たなければなりません（両方は不可）。
- コマンドリストは、空でない文字列からなる空でない配列でなければなりません。

## 開発

```bash
bun install
bun run build   # outputs to dist/
bun run dev     # tsc --watch
```

## 変更履歴

[CHANGELOG.md](CHANGELOG.md) を参照してください。

## ライセンス

MIT — [LICENSE](LICENSE) を参照してください。
