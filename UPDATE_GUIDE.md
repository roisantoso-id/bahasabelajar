# BahasaBelajar 部署与更新说明

这份文档只保留最常用的两件事：

- GitHub Pages 怎么部署
- Supabase 题库怎么更新

如果你只想改 BIPA 模拟测评题目，直接看「二、题库更新」。

---

## 一、GitHub Pages 部署

### 1. 部署仓库

部署仓库是独立的：

- `roisantoso-id/bahasabelajar`
- 分支：`master`
- 线上地址：`https://roisantoso-id.github.io/bahasabelajar/`

本地克隆默认放这里：

```bash
~/bahasabelajar-deploy
```

### 2. 每次改完前端后怎么发

```bash
# 复制前端页面
cp h5/index.html ~/bahasabelajar-deploy/index.html

# 如果图片有变动，一并同步
cp -r h5/img ~/bahasabelajar-deploy/img

# 提交并推送
cd ~/bahasabelajar-deploy
git add -A
git commit -m "更新"
git push
```

### 3. 怎么确认线上已更新

GitHub Pages 一般 1 到 2 分钟重建完成。

```bash
gh api repos/roisantoso-id/bahasabelajar/pages/builds/latest --jq '.status'
```

如果你想直接看网页，也可以打开：

```text
https://roisantoso-id.github.io/bahasabelajar/
```

---

## 二、题库更新

现在 `BIPA 模拟测评` 已经改成 **Supabase 表驱动**，不再依赖本地 JSON。

### 1. 题库表

题库使用这张表：

- `public.vocab_exam_bank`

建表文件：

- `supabase/vocab-exam-schema.sql`

初始题库文件：

- `supabase/vocab-exam-seed.sql`

### 2. 首次部署题库

在 Supabase Dashboard 的 SQL Editor 依次执行：

1. `supabase/vocab-exam-schema.sql`
2. `supabase/vocab-exam-seed.sql`

### 3. 以后怎么更新题目

以后只改 Supabase 数据，不需要重新部署网页。

你可以直接在表里做：

- 新增题目
- 修改题目
- 删除题目
- 切换 `active = false` 暂时下线题目

前端会实时读取最新数据。

### 4. 题目结构

每条题目大致包含这些字段：

- `section`: `word` / `sentence` / `reading`
- `difficulty`: `easy` / `medium` / `hard`
- `prompt`: 题干
- `options`: 选项数组
- `answer`: 正确答案
- `explain`: 解析
- `passage_title`: 阅读短文标题，仅阅读题使用
- `passage_text`: 阅读短文正文，仅阅读题使用
- `sort_order`: 同一组题目的顺序
- `active`: 是否启用

### 5. 如果要我直接帮你改

我可以直接执行 Supabase 侧更新，但请注意：

- `service key` 只能用于本地私有环境或后端操作
- 不要把 `service key` 写进 `h5/index.html`
- 不要提交到 GitHub

推荐方式是：

```bash
export SUPABASE_SERVICE_ROLE_KEY='你的 service key'
```

然后我就可以在本机用这个 key 直接更新表数据。

---

## 三、改前端和改题库的区别

### 只改题库

- 不需要部署网页
- 只改 Supabase 表

### 改页面 UI / 文案 / 逻辑

- 需要更新 `h5/index.html`
- 然后同步到部署仓库并 push

### 同时改页面和题库

- 先改 `h5/index.html`
- 再更新 Supabase 数据
- 最后部署 GitHub Pages

---

## 四、最短流程备忘

### 发网页

```bash
cp h5/index.html ~/bahasabelajar-deploy/index.html
cp -r h5/img ~/bahasabelajar-deploy/img
cd ~/bahasabelajar-deploy
git add -A && git commit -m "更新" && git push
```

### 改题库

```text
Supabase Dashboard -> SQL Editor -> 更新 vocab_exam_bank
```

### 让我直接操作数据库

```text
给我 service key，我在本机私有环境里改
```
