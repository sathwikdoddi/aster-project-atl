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
              This is the first development milestone, covering October 12–18.
              All names, stories, locations, and dates in the archive are
              fictional examples. They do not document real people or police
              incidents.
            </p>
            <p>
              The archive includes one detailed sample and two partial examples
              to demonstrate the structure. Missing information is shown openly,
              and illustrations are abstract flowers rather than photographs of
              real people.
            </p>
          </section>
          <section>
            <h2>Building a shared foundation.</h2>
            <p>
              The frontend currently reads local sample data. A small API and a
              shared schema provide a starting point for integration with the
              datastore being planned with GT’s 180 Consulting team.
            </p>
            <p>
              The data format, source review process, and publication workflow
              still need to be agreed with Aster and 180 Consulting. Real case
              material should be reviewed and approved before it is added.
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
