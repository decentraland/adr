# Archive standards repository

# Context

* Is the [decentraland/standards](https://github.com/decentraland/standards) repository still useful?
* Does it make sense to have ADR and standards?
* How does it play with [decentraland/proposals](https://github.com/decentraland/proposals)?

# Options

* Archive both repositories, leaving only [decentraland/adr](https://github.com/decentraland/adr)
* ✅ Archive [decentraland/standards](https://github.com/decentraland/standards), leaving [decentraland/adr](https://github.com/decentraland/adr) and [decentraland/proposals](https://github.com/decentraland/proposals) untouched.
* Only use [decentraland/adr](https://github.com/decentraland/adr)

# Decision

* Archive [decentraland/standards](https://github.com/decentraland/standards)
* Keep: [decentraland/adr](https://github.com/decentraland/adr) and [decentraland/proposals](https://github.com/decentraland/proposals) untouched.

Because:
* `proposals` is a public repository where the community can contribute with new ideas and improvements. It has a formal review process that can ve leveraged by anyone.
* `standards` is not actively maintained, it has a strict approval process. Most of the standards can be also defined as ADR, eliminating the need of maintain both repositories.

Date: 2020-10-16