import { CvDto } from '@/lib/types/resume';

export function ResumeDetails({ cv }: { cv: CvDto }) {
  return (
    <div className="mx-auto max-w-4xl rounded-lg bg-white px-4 py-8 shadow-sm">
      <header className="mb-10 border-b border-purple-100 pb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-800">
          {cv.basics?.firstName} {cv.basics?.lastName}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {cv.basics?.email && (
            <div className="flex items-center">
              <svg className="mr-2 h-4 w-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
              </svg>
              <span>{cv.basics.email}</span>
            </div>
          )}
          {cv.basics?.phoneNumber && (
            <div className="flex items-center">
              <svg className="mr-2 h-4 w-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
              </svg>
              <span>{cv.basics.phoneNumber}</span>
            </div>
          )}
          {cv.basics?.location?.city && (
            <div className="flex items-center">
              <svg className="mr-2 h-4 w-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span>
                {cv.basics.location.city}
                {cv.basics.location.country && `, ${cv.basics.location.country}`}
              </span>
            </div>
          )}
        </div>
        {cv.basics?.summary && <p className="mt-4 text-gray-700 italic">{cv.basics.summary}</p>}
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-8 md:col-span-2">
          {cv.work?.length ? (
            <section>
              <h2 className="mb-4 border-b border-purple-100 pb-2 text-xl font-bold text-gray-800">
                <span className="border-b-2 border-purple-500 pb-2">Doświadczenie</span>
              </h2>
              <div className="space-y-6">
                {cv.work.map((w, i) => (
                  <div
                    key={i}
                    className="relative border-l-2 border-purple-100 pl-6 transition-colors hover:border-purple-300"
                  >
                    <div className="absolute top-1 left-[-7px] h-3 w-3 rounded-full bg-purple-500"></div>
                    <h3 className="font-semibold text-gray-800">{w.position}</h3>
                    <p className="text-sm font-medium text-purple-700">{w.company}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {w.startDate} – {w.endDate || 'Obecnie'}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">{w.description}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {cv.education?.length ? (
            <section>
              <h2 className="mb-4 border-b border-purple-100 pb-2 text-xl font-bold text-gray-800">
                <span className="border-b-2 border-purple-500 pb-2">Edukacja</span>
              </h2>
              <div className="space-y-6">
                {cv.education.map((e, i) => (
                  <div
                    key={i}
                    className="relative border-l-2 border-purple-100 pl-6 transition-colors hover:border-purple-300"
                  >
                    <div className="absolute top-1 left-[-7px] h-3 w-3 rounded-full bg-purple-500"></div>
                    <h3 className="font-semibold text-gray-800">{e.degree}</h3>
                    <p className="text-sm font-medium text-purple-700">
                      {e.field} • {e.institution}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {e.startDate} – {e.endDate || 'Obecnie'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-8">
          {cv.skills?.length ? (
            <section className="rounded-lg bg-gray-50 p-4">
              <h2 className="mb-4 text-xl font-bold text-gray-800">
                <span className="border-b-2 border-purple-500 pb-1">Umiejętności</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {cv.skills.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-purple-50 px-3 py-1 text-sm text-purple-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {cv.languages?.length ? (
            <section className="rounded-lg bg-gray-50 p-4">
              <h2 className="mb-4 text-xl font-bold text-gray-800">
                <span className="border-b-2 border-purple-500 pb-1">Języki</span>
              </h2>
              <ul className="space-y-2">
                {cv.languages.map((l, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">{l.language}</span>
                    <span className="rounded bg-purple-50 px-2 py-1 text-sm text-purple-700">
                      {l.fluency}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {cv.certificates?.length ? (
            <section className="rounded-lg bg-gray-50 p-4">
              <h2 className="mb-4 text-xl font-bold text-gray-800">
                <span className="border-b-2 border-purple-500 pb-1">Certyfikaty</span>
              </h2>
              <ul className="space-y-3">
                {cv.certificates.map((c, i) => (
                  <li key={i} className="flex flex-col">
                    <span className="font-medium text-gray-700">{c.name}</span>
                    <span className="text-xs text-gray-500">{c.date}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
