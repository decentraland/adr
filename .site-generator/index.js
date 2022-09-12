module.exports = function ({ context }) {
  const isBranchOrLocal = !!process.env.IS_DRAFT || process.env.CF_PAGES_BRANCH !== "main"
  context.DRAFT = isBranchOrLocal
  if (process.env.CF_PAGES_URL && isBranchOrLocal) {
    context.baseUrl = process.env.CF_PAGES_URL
  }
}
