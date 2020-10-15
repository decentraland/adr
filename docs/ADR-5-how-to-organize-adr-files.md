# How to organize ADR files

## Context and Problem Statement

- How do we call the folder for assets?
- What is the pattern of the filename where an ADR is stored?
- How do we write titles in the ADR documents?

## Considered Options

### Asset folder
* ✅ `resources`
* `images`
* `files`

### Filename

* `adr/YYYY-MM-DD-title-using-dashes.md` and `adr/resources/YYYY-MM-DD-title-using-dashes/{filename}` 
* `docs/arch/ADR-NNNN.md` and `docs/arch/resources/ADR-NNNN/{filename}` 
* `doc/ADR/NNNN-title-using-dashes.md` and `doc/adr/resources/NNNN/{filename}` 
* ✅ `docs/ADR-NNNN-title-using-dashes.md` and `docs/resources/ADR-NNNN/{filename}` 

### Title (markdown)

* `# YYYY-MM-DD - Title`
* `# ADR-NNNN - Title`
* `# #NNNN - Title`
* ✅ `# Plain title`

## Decision Outcome

### Asset folder
Chosen option: `resources`

### Filename

Chosen option: `docs/ADR-NNNN-title-using-dashes.md` and `docs/resources/ADR-NNNN/{filename}`, because

- Adding `arch` or `adr` folders is redundant.
- `NNNN` provides a unique number, which can be used for referencing using an immutable number (and generating permalinks if we render the repository to a static site).  
- The creation time of an ADR is of historical interest only, if it gets updated somehow. It can be embeded in the file or extracted from git history.
- Having no spaces in filenames eases working in the command line.
- Prefixing with `docs/ADR-` enables future new kinds of documents.
- Calling a folder `docs/resources/ADR-NNNN/{filename}` (omiting the `title-with-dashes`) helps in refactors or changes in the file names.

### Title (markdown)

Chosen option: `# Plain title` because:

- At the moment of writing the ADR the writer may not know the final ADR number.
- It can be embeded by rendering tools
- It would duplicate data from the filename

## Participants

- Ignacio Mazzara
- Agustin Mendez

Date: 2020-10-15