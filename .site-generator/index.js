const path = require("path")

module.exports = function ({ context }) {
  context.configuration.staticFolder = path.resolve(__dirname, "../public")

  const isBranchOrLocal = !!process.env.IS_DRAFT || process.env.CF_PAGES_BRANCH !== "main"
  context.DRAFT = isBranchOrLocal
  if (process.env.CF_PAGES_URL && isBranchOrLocal) {
    context.baseUrl = process.env.CF_PAGES_URL
  }

  context.preProcessPage = function (page) {
    if (!page.matterfront) console.error(page)
    if (page.matterfront.adr) {
      page.slug = `/adr/ADR-${page.matterfront.adr}`
      page.layout = "doc"
      page.matterfront.layout = "doc"
      if (page.matterfront["spdx-license"] !== "CC0-1.0")
        throw new Error(`Page ADR-${page.matterfront.adr} as invalid license: ${page.matterfront["spdx-license"]}`)

      checkAdrStatus(page)
    } else if (page.matterfront.rfc) {
      console.error(page)
      throw new Error(`RFC are deprecated, plase upgrade. More info in ADR-1`)
    }
  }
}

function checkAdrStatus(page) {
  const validStatuses = new Set(["Draft", "Review", "LastCall", "Final", "Stagnant", "Withdrawn", "Living"])
  const validTypes = new Set(["RFC", "Standards Track", "Meta"])
  if (!page.matterfront.status) throw new Error("ADR-" + page.matterfront.adr + " has no `status`")
  if (!page.matterfront.type) throw new Error("ADR-" + page.matterfront.adr + " has no `type`")
  if (!validTypes.has(page.matterfront.type))
    throw new Error(
      "ADR-" +
        page.matterfront.adr +
        " has invalid `type: " +
        page.matterfront.type +
        "`, valid types are: " +
        Array.from(validTypes).join(",")
    )

  if (!validStatuses.has(page.matterfront.status))
    throw new Error(
      "ADR-" +
        page.matterfront.adr +
        " has invalid `status: " +
        page.matterfront.status +
        "`, valid statuses are: " +
        Array.from(validStatuses).join(",")
    )
}
