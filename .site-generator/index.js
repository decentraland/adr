module.exports = function({ context }) {
  context.DRAFT = !!process.env.IS_DRAFT || !!process.env.CF_PAGES_BRANCH
  if (process.env.CF_PAGES_URL) {
    context.baseUrl = process.env.CF_PAGES_URL
  }
}