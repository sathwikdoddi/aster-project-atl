import Link from "next/link";
import { CaseExplorer } from "@/components/case-explorer";
import { AsterMark, Arrow } from "@/components/icons";
import { publicCaseRepository } from "@/server/public-cases";

export default async function Home() {
  const cases = await publicCaseRepository.list();
  return (
    <main id="main">
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="small-rule" /> PEOPLE FIRST. ALWAYS.
          </p>
          <h1 id="hero-heading">
            A life is more than
            <br />a single <em>moment.</em>
          </h1>
          <p className="hero-description">
            Behind every case is a person. Explore the lives, passions, and
            stories of people lost to police violence—and the communities that
            remember them.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#explore">
              Explore the stories <Arrow />
            </a>
            <Link className="quiet-link" href="/about">
              Our purpose <Arrow diagonal />
            </Link>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="art-corner top-left">EST. IN REMEMBRANCE</span>
          <span className="art-corner top-right">✳</span>
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <AsterMark className="hero-flower flower-one" />
          <AsterMark className="hero-flower flower-two" />
          <AsterMark className="hero-flower flower-three" />
          <div className="hero-art-caption">
            <span>Lives remembered.</span>
            <span>Stories carried forward.</span>
          </div>
          <span className="art-corner bottom-left">THE ASTER PROJECT</span>
          <span className="art-corner bottom-right">01 — ∞</span>
        </div>
      </section>
      <div className="principle-strip">
        <p>
          <span>01</span> Remember the person
        </p>
        <p>
          <span>02</span> Understand the story
        </p>
        <p>
          <span>03</span> Make space for what continues
        </p>
      </div>
      <CaseExplorer cases={cases} />
      <section className="care-note">
        <AsterMark />
        <div>
          <p className="eyebrow">A NOTE BEFORE YOU EXPLORE</p>
          <h2>Approach each story with care.</h2>
          <p>
            This platform is being built to center humanity, context, and
            remembrance. Some future case material may be difficult to read. You
            can move at your own pace.
          </p>
          <p className="prototype-note">
            This preview contains fictional examples only. Real case information
            will be added after Aster’s review.
          </p>
        </div>
        <Link className="text-link" href="/about">
          Read about our approach <Arrow diagonal />
        </Link>
      </section>
    </main>
  );
}
