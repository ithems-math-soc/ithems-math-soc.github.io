# Add Publication

In order to add your new publication you need to edit the file `publications/index.md`.

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
the `publications/index.md`.

**Listing your Paper on the Website**

Edit the top the file `publications/index.md`. Each entry starts with the
symbol `-`, for example:

```shell
- Glynatsi, N. E., Hilbe, C., & Murase, Y. (2025).  
  [**Exact conditions for evolutionary stability in indirect reciprocity under noise**](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1013584).  
  _PLOS Computational Biology_.
```

The convention is the following:

```shell
- Author, A., Collaborator, B., & Researcher, C. (year).  
  [**Title of the paper**](link to paper).  
  _Journal Name_.
```

This means:

- the authors come first
- the year appears in parentheses after the authors
- the paper title is bold and linked
- the journal name is italicized on the next line

Once you have made all the necessary changes you can review them locally
by [compile the website](Installation.md).

When you are ready you need to `git add` the files you have changed/added,
then to `git commit` and finally push your branch to GitHub:

```shell
$ git push -u origin short-publication-title
```

Your branch should then appear on GitHub. Open a pull request from your branch
into `main`.
