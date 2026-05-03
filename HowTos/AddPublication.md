# Add Publication

In order to add your new publication you need to edit the file `_data/publications.yml`.
Both the English and Japanese publication pages are generated from this shared
data file, so do not edit `publications/index.md` or `ja/publications/index.md`
for normal publication updates.

Firstly make sure your local `main` branch is up to date:

```shell
$ git checkout main
$ git pull origin main
```

Then create a new branch (do not make changes directly on `main`).
To branch use the commands `git branch <name>` and `git checkout <name>`.

Name the branch as `short-publication-title`. For example:

```shell
$ git branch future-egt
$ git checkout future-egt
```

**Uploading Paper**

Once you are on your new branch add a copy of your paper in the folder
`publications/papers`. There is no convention regarding naming the `pdf` file,
however, try to use sensible names and avoid abstract names such as `main.pdf`
or `mypaper.pdf`. Also avoid spaces and use `_` instead.

Once you have copied your paper in the folder you are ready to edit
`_data/publications.yml`.

**Listing your Paper on the Website**

Edit the appropriate year in `_data/publications.yml`. Each entry has this
format:

```yaml
- authors: Glynatsi, N. E., Hilbe, C., & Murase, Y.
  year: 2025
  title: Exact conditions for evolutionary stability in indirect reciprocity under noise
  url: https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1013584
  journal: PLOS Computational Biology
```

The convention is the following:

```yaml
- authors: Author, A., Collaborator, B., & Researcher, C.
  year: publication year
  title: Title of the paper
  url: link to paper
  journal: Journal Name
```

This means:

- the authors come first
- the year is stored as a number
- the paper title is stored without Markdown formatting
- the paper URL is stored in `url`
- the journal name is stored without Markdown formatting
- the page template handles the display formatting for both languages

If you add a local PDF, add a `pdf` line using a path from the repository root:

```yaml
  pdf: publications/papers/<your paper>.pdf
```

Once you have made all the necessary changes you can review them locally
by [compile the website](Installation.md).

When you are ready you need to `git add` the files you have changed/added,
then to `git commit` and finally push your branch to GitHub:

```shell
$ git push -u origin short-publication-title
```

Your branch should then appear on GitHub. Open a pull request from your branch
into `main`.
