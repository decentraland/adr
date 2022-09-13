const path = require('path')

module.exports = function ({ context }) {
  context.configuration.staticFolder = path.resolve(__dirname, '../public')

  const isBranchOrLocal = !!process.env.IS_DRAFT || process.env.CF_PAGES_BRANCH !== "main"
  context.DRAFT = isBranchOrLocal
  if (process.env.CF_PAGES_URL && isBranchOrLocal) {
    context.baseUrl = process.env.CF_PAGES_URL
  }

  context.preProcessPage = function (page) {
    if (page.matterfront.adr) {
      page.slug = `/adr/ADR-${page.matterfront.adr}`

      checkAdrStatus(page)
    } else if (page.matterfront.rfc) {
      page.slug = `/rfc/RFC-${page.matterfront.rfc}`
    }
  }
}

function checkAdrStatus(page) {
  const validStatuses = new Set(["PROPOSED", "ACCEPTED", "DEPRECATED", "SUPERSEDED"])
  if (!page.matterfront.status) throw new Error("ADR-" + page.matterfront.adr + " has no `status`")
  if (!validStatuses.has(page.matterfront.status))
    throw new Error(
      "ADR-" +
        page.matterfront.adr +
        " has invalid `status: " +
        page.status +
        "`, valid statuses are: " +
        Array.from(validStatuses).join(",")
    )
}
