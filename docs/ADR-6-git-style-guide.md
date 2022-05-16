# Decentraland's git style guide

## Context or problem to solve

* How should git histories look like?
* What format should we use to write commit messages?

## Decision

We agreed on normalizing commit messages to master branches to avoid things like `Merge pull request #15 from client/menduz-patch-10` in persuit of more semantic messages like `fix: commit style guide, closes #15`. That is particularly helpful in repositories with several contributors and fosters professionalism in open source repositories.

### Branches

When you work on a branch on a specific issue, we keep the spirit of [semantic branch naming](https://medium.com/@hanuman_95739/how-to-integrate-branch-naming-commit-message-and-push-rules-in-gitlab-fe9cd642cc1a). Think of this as writing what is and what you are doing in a three word sentence The first one must be oune of the list. For instance: 

```
fix/wrong_host
^  ^^------------^
|  ||
|  |+----> Summary in present tense.
|  +-----> Slash
+--------> Type: chore, docs, feat, fix, refactor, style, or test.
```

Other examples are:
```
docs/update_readme
refactor/new_welcome_message
```
Look for the *Examples* in section *Commit messages* for a description of the allowed branch types.
It's OK to use hyphens (`-`) or underscores (`_`) to replace spaces. Avoid any other special characters, like `#` or `$`, as they might lead to problems, for example, when deploying the content using the branch name as part of the URL. The branch name should match this regexp: `(chore|docs|feat|fix|refactor|style|test)/[0-9a-zA-Z_-]+`


#### Exceptions:
This rules are ignored when you work on *environment* branches like `master`, `development`, `staging` and so on. 

## Commit messages

In master branches and pull requests, we do [semantic commits](https://seesparkbox.com/foundry/semantic_commit_messages).

```
feat: add hat wobble
^--^  ^------------^
|     |
|     +-> Summary in present tense.
|
+-------> Type: chore, docs, feat, fix, refactor, style, or test.
```

Examples:

```yaml
chore: add Oyster build script
```
```yaml
docs: explain hat wobble
```
```yaml
feat: add beta sequence, implements #332
```
```yaml
fix: remove broken confirmation message, closes #123
```
```yaml
refactor: share logic between 4d3d3d3 and flarhgunnstow
```
```yaml
style: convert tabs to spaces
```
```yaml
test: ensure Tayne retains clothing
```
```yaml
revert: reverts commit 4d3d3d3
```
```yaml
break: property no longer accepts the previous data, closes #289
```

### Allowed `<type>` values:
   * `feat` new feature
   * `fix` bug fix
   * `docs` changes to the documentation
   * `style` formatting, linting, etc; no production code change
   * `refactor` refactoring production code, eg. renaming a variable
   * `test` adding missing tests, refactoring tests; no production code change
   * `chore` updating build tasks etc; no production code change
   * `revert` a commit is being reverted
   * `break` any change that could potentially cause failures in the applications that consumes it

## Merge pull requests

We do squash and merge for pull requests. The squashed commit message must follow the [semantic commits](https://seesparkbox.com/foundry/semantic_commit_messages) rules.

Since we are squashing all the commits, inside a pull request's commits it is RECOMMENDED to follow this same convention. It is a team/contributor decision, as long as the title of the PR (and therefore the commit message to be merged) follows this reference.

## Referencing issues or JIRA tasks

Please refer to the issue so we can track the progress like this: 
```yaml
fix: some bug, closes #14
```

## Merge commits

Avoid `Merge branch 'a' into 'master'` commit messages. Rebase when possible.

## Merging pull requests

To keep a good trace of all the changes in the repositories, **"Squash and merge"** is the best option. All repositories should be configured to accept only squash merges to `master` or environment branches.

# Security

Sign all your commits with GPG. If you have a physical key, use that key. Otherwise set up a GPG key in your computer.
In the future we will add a CI process to verify commit signatures.

- https://github.com/blog/2144-gpg-signature-verification
- https://help.github.com/articles/generating-a-new-gpg-key/
- https://help.github.com/articles/signing-commits-using-gpg/

# Participants

- Esteban Ordano
- Agustin Mendez

_This definition was migrated from the archived [standards](https://github.com/decentraland/standards/blob/master/standards/git-usage.md) repository._