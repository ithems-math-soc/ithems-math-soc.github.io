# Add a Blog Post

The Blog page (https://ithems-math-soc.github.io/blog/) is for short news
items: a new paper, a talk, a workshop report, a visitor, a new member, a
seminar announcement, an award, media coverage, or a job opening.

You do **not** need git or a local copy of the website to post. Everything is
done on GitHub in your browser.

## Posting (everyone)

1. Open the **New blog post** form:
   https://github.com/ithems-math-soc/ithems-math-soc.github.io/issues/new?template=blog-post.yml
   (or go to the repository, click **Issues** → **New issue** → **New blog post**).
2. In the title box, replace `[Blog] ` with the title of your post.
3. Fill in the fields:
   - **Type** (required): pick one from the list. It is shown as a coloured tag
     on the Blog page and can be used to filter posts.
   - **Date**: `YYYY-MM-DD`. Leave empty for today.
   - **Author**: your name as it should appear. Optional.
   - **Link** / **Link label**: an optional URL (paper, seminar page, ...)
     shown as a button at the end of the post, and the text for that button.
   - **Body** (required): the post itself, in English, written in Markdown.
     The first paragraph is used as the summary on the Blog page.
     To add **photos**, drag and drop the image files into the Body box; GitHub
     uploads them and inserts a link automatically.
4. Click **Submit new issue**.

Within about a minute a bot comments on your issue with a link to a
**pull request** that contains your post. Nothing is published yet.

## Reviewing and publishing (any team member)

1. Open the pull request linked from the issue.
2. Click **Files changed**. You will see:
   - `_posts/blog/<date>-<slug>.md` – the English post
   - `_posts/ja/blog/<date>-<slug>.md` – the Japanese version, machine
     translated by DeepL
   - `images/blog/<slug>/` – any photos
3. Read through the text. If the Japanese translation needs a fix, you can
   edit it directly: on the file, click the **...** menu → **Edit file**,
   change the text, and **Commit changes** to the same branch.
4. Click **Merge pull request** → **Confirm merge**. The website rebuilds in a
   few minutes and the post appears on the Blog page. The issue closes
   automatically.

## Changing a post

**Before the pull request is merged:** edit the issue (title, fields, or
body). The pull request is updated automatically. Note that this regenerates
the post files, so any hand edits made on the pull request are overwritten;
make translation fixes after your last edit to the issue.

**After it is merged:** either

- edit the issue again – a new pull request with the update is opened, or
- edit the post file directly on GitHub (`_posts/blog/...` and the matching
  file in `_posts/ja/blog/`) and open a pull request.

## Deleting a post

Delete both files (`_posts/blog/<date>-<slug>.md` and
`_posts/ja/blog/<date>-<slug>.md`) and the folder `images/blog/<slug>/` if it
exists, then open a pull request. On GitHub: open the file, click **...** →
**Delete file**.

## Writing tips

- Short is fine. Two or three sentences and a photo keep the page alive.
- Avoid `@mentions` and `#123` issue references in the body; they are GitHub
  features and will show up as plain text on the website.
- Markdown basics: `**bold**`, `*italic*`, `[text](https://...)` for links,
  `- item` for bullet lists.

## For maintainers

### How it works

- `.github/ISSUE_TEMPLATE/blog-post.yml` – the form.
- `.github/workflows/blog-post.yml` – runs when an issue with the `blog-post`
  label is opened or edited by a repository collaborator. It calls the script
  below, commits to a branch `blog/issue-<n>`, and opens or updates a pull
  request.
- `.github/scripts/issue_to_post.py` – parses the form, downloads attached
  images into `images/blog/<slug>/`, translates with DeepL, and writes the two
  post files. It records `issue: <n>` in the front matter so edits replace
  the earlier files instead of duplicating them.
- `_data/blog_types.yml` – the list of post types and their Japanese labels.
  If you change it, change the **Type** dropdown in the form as well.
- `_includes/blog-list.html`, `_layouts/blog.html`, `_sass/_blog.scss`,
  `js/blog.js` – the Blog page, post layout, styles, and the filter / search /
  sort behaviour.

### One-time setup

1. **Settings → Actions → General → Workflow permissions**: tick
   *Allow GitHub Actions to create and approve pull requests*.
2. **Settings → Secrets and variables → Actions → New repository secret**:
   name `DEEPL_API_KEY`, value: an API key from a DeepL account
   (https://www.deepl.com/pro-api — the free plan is enough). Without this
   secret, posts are still created, but in English only.
3. The `blog-post` label must exist (it does; recreate it if deleted).

### Switching to publishing without review

When the team is comfortable with the flow, the pull request step can be
replaced by a direct push to `main`: in `.github/workflows/blog-post.yml`,
check out `main` instead of `blog/issue-<n>`, push to `main`, and drop the
"Open or update the pull request" step.

### Post file format

If you ever need to write a post by hand, this is the format the script
produces:

```yaml
---
layout: blog
title: "New paper published in PNAS"
type: Paper
lang: en
categories: blog
author: "Your Name"              # optional
link: "https://doi.org/..."     # optional
link_label: "Read the paper"    # optional
translation_url: /ja/blog/new-paper-published-in-pnas/   # if a Japanese file exists
image:
  teaser: blog/new-paper-published-in-pnas/image-1.jpg   # optional thumbnail
---

Body text in Markdown.
```

The Japanese file lives at the same name under `_posts/ja/blog/` and has
`lang: ja`, `categories: [ja, blog]`, `site_title: 数理社会科学チーム`, and
`translation_url` pointing back to the English post.
