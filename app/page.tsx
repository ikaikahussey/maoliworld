import Link from 'next/link'

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Maoli World
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          A community forum for sharing and discussing Hawaiian culture, traditions,
          and experiences.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Join the Discussion
          </h2>
          <p className="text-gray-600 mb-4">
            Connect with others who share your passion for Hawaiian culture and
            traditions.
          </p>
          <Link href="/forums" className="btn-primary inline-block">
            Browse Forums
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Share Your Story
          </h2>
          <p className="text-gray-600 mb-4">
            Share your experiences, knowledge, and insights with our community.
          </p>
          <Link href="/forums" className="btn-primary inline-block">
            Create Post
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Discover Content
          </h2>
          <p className="text-gray-600 mb-4">
            Find interesting discussions and resources about Hawaiian culture.
          </p>
          <Link href="/search" className="btn-primary inline-block">
            Search
          </Link>
        </div>
      </section>

      <section className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Why Join Maoli World?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Community
            </h3>
            <p className="text-gray-600">
              Connect with others who share your passion for Hawaiian culture.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Knowledge
            </h3>
            <p className="text-gray-600">
              Learn from others and share your own experiences and insights.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Culture
            </h3>
            <p className="text-gray-600">
              Celebrate and preserve Hawaiian culture and traditions together.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
} 