const Feed = require('feed').Feed
const description = require('description')
const memoize = require('fast-memoize')
const yubikiri = require('yubikiri')

const types = {
  blog: 'blog',
  releases: 'releases',
}

module.exports.setupFeed = memoize(async (type, items) => {
  let feed = new Feed({
    title: 'Electron',
    description:
      'Build cross platform desktop apps with JavaScript, HTML, and CSS.',
    id: 'https://electronjs.org/',
    link: 'https://electronjs.org/',
    generator: 'Electron website',
    feedLinks: {
      json: 'https://electronjs.org/releases.json',
      atom: 'https://electronjs.org/releases.xml',
      json1: 'https://electronjs.org/blog.json',
      atom1: 'https://electronjs.org/blog.xml',
    },
  })

  switch (type) {
    case types.releases:
      items.forEach((release) => {
        feed.addItem({
          title: `Electron v${release.data.version}`,
          id: `https://electronjs.org/releases#${release.data.version}`,
          date: new Date(release.data.created_at),
          link: release.data.html_url,
          content: release.data.body_html,
        })
      })
      break
    case types.blog: {
      const posts = await Promise.all(
        items.map((post) =>
          yubikiri({
            href: post.href(),
            title: post.title(),
            content: post.content(),
            date: post.date(),
            author: async () => {
              const authors = await post.authors()
              return { name: authors[0] }
            },
            image: null, // TODO
          })
        )
      )
      posts
        .sort((a, b) => b.date.localeCompare(a.date))
        .forEach((post) => {
          feed.addItem({
            id: `https://electronjs.org${post.href}`,
            title: post.title,
            content: post.content,
            description: description({
              content: post.content,
              endWith: '[...]',
              limit: 200,
            }),
            link: `https://electronjs.org${post.href}`,
            date: new Date(post.date),
            published: new Date(post.date),
            author: post.author,
            image: post.image || 'https://electronjs.org/images/opengraph.png',
          })
        })
      break
    }
    default:
      console.log(type === types.releases)
      throw new Error('Invalid rss feed type')
  }

  return feed
})
