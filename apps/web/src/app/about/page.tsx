import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, AsterMark } from "@/components/icons";

export const metadata: Metadata = { title: "About the project" };

export default function AboutPage() {
  return (
    <main id="main" className="about-page">
      <p className="eyebrow">THE PURPOSE BEHIND THE PLATFORM</p>
      <h1>
        People at the center.
        <br />
        <em>Stories with room to grow.</em>
      </h1>
      <p className="about-intro">
        The Aster Project’s interactive archive is being developed to help
        people explore the lives and cases of people lost to police violence.
      </p>
      <div className="about-layout">
        <AsterMark />
        <div>
          <section>
            <h2>A life, in context.</h2>
            <p>
              Each case has space for early life, passions, death,
              investigation, and legacy. A timeline connects important moments
              while individual sections make room for context and personal
              memories.
            </p>
            <p>
              The goal is an accessible, thoughtful place to explore information
              as it is documented—not a complete account of a person reduced to
              a single event.
            </p>
          </section>
          <section id="prototype">
            <h2>About this prototype</h2>
            <p>
              {process.env.CONTENT_SOURCE === "published"
                ? "Profiles are shared here after review and publication by The Aster Project. Any fictional demonstration profiles are clearly labeled."
                : "This is a development prototype. All names, stories, locations, and dates in this demo are fictional examples. They do not document real people or police incidents."}
            </p>
            <p>
              The archive makes room for detailed stories and profiles that are
              still being documented. Missing information is shown openly, and
              illustrations are abstract flowers rather than photographs of real
              people.
            </p>
          </section>
          <section>
            <h2>Building a shared foundation.</h2>
            <p>
              Working records are maintained in Airtable. The owner workspace
              selects the content to share and saves approved public versions
              separately.
            </p>
            <p>
              The owner dashboard controls which information is published. The
              source review and publication workflow still need to be agreed
              with Aster and 180 Consulting. Real case material should be
              reviewed and approved before it is added.
            </p>
          </section>
          <Link className="button primary" href="/#explore">
            Explore the sample stories <Arrow />
          </Link>
        </div>
      </div>
    </main>
  );
}
