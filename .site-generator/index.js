module.exports = function ({ context }) {
  const isBranchOrLocal = !!process.env.IS_DRAFT || process.env.CF_PAGES_BRANCH !== "main"
  context.DRAFT = isBranchOrLocal
  if (process.env.CF_PAGES_URL && isBranchOrLocal) {
    context.baseUrl = process.env.CF_PAGES_URL
  }

  context.preProcessPage = function (page) {
    if (page.adr) {
      page.slug = `/adr/ADR-${page.adr}`

      checkAdrStatus(page)
    } else if (page.rfc) {
      page.slug = `/rfc/RFC-${page.rfc}`
    }
  }
}

function checkAdrStatus(page) {
  const validStatuses = new Set(["PROPOSED", "ACCEPTED", "DEPRECATED", "SUPERSEDED"])
  if (!page.status) throw new Error("ADR-" + page.adr + " has no `status`")
  if (!validStatuses.has(page.status))
    throw new Error(
      "ADR-" +
        page.adr +
        " has invalid `status: " +
        page.status +
        "`, valid statuses are: " +
        Array.from(validStatuses).join(",")
    )
}
