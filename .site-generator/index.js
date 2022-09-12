module.exports = function({ context }) {
  context.DRAFT = !!process.env.IS_DRAFT
}